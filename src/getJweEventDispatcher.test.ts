import * as jose from 'node-jose';
import { getJweEventDispatcher } from './getJweEventDispatcher';
import { ErrorHandler, EventHandlers } from './getEventDispatcher';

async function generateEncKey(): Promise<string> {
  const keystore = jose.JWK.createKeyStore();
  const key = await keystore.generate('oct', 256, { alg: 'A256GCM', use: 'enc' });
  return JSON.stringify(key.toJSON(true));
}

async function encrypt(event: any, keyJson: string): Promise<string> {
  const keystore = jose.JWK.createKeyStore();
  const jwk = await keystore.add(keyJson, 'json');
  const encryptor = jose.JWE.createEncrypt({ format: 'compact', fields: { alg: 'dir', enc: 'A256GCM' } }, jwk);
  return encryptor.update(JSON.stringify(event)).final();
}

const validEvent = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  type: 'test.event',
  metadata: {
    cid: '550e8400-e29b-41d4-a716-446655440001',
    pid: '550e8400-e29b-41d4-a716-446655440002'
  }
};

describe('getJweEventDispatcher', () => {
  test('decrypts and dispatches a valid event to the correct handler', async () => {
    const keyJson = await generateEncKey();
    const encrypted = await encrypt(validEvent, keyJson);

    const mockError = jest.fn();
    const mockHandler = jest.fn();
    const handlers: EventHandlers = { 'test.event': mockHandler };

    const dispatcher = getJweEventDispatcher(mockError, handlers, keyJson);
    await dispatcher(encrypted);

    expect(mockHandler).toHaveBeenCalledWith(mockError, validEvent);
    expect(mockError).not.toHaveBeenCalled();
  });

  test('calls error handler with DecryptionError when the key does not match', async () => {
    const keyJson = await generateEncKey();
    const wrongKeyJson = await generateEncKey();
    const encrypted = await encrypt(validEvent, keyJson);

    const mockError = jest.fn();
    const mockHandler = jest.fn();
    const handlers: EventHandlers = { 'test.event': mockHandler };

    const dispatcher = getJweEventDispatcher(mockError, handlers, wrongKeyJson);
    await dispatcher(encrypted);

    expect(mockHandler).not.toHaveBeenCalled();
    expect(mockError).toHaveBeenCalledTimes(1);
    const errorArg = mockError.mock.calls[0][0];
    expect(errorArg.error).toBe('DecryptionError');
    expect(errorArg.message).toContain('Failed to decrypt event');
  });

  test('calls error handler with DecryptionError for garbage input', async () => {
    const keyJson = await generateEncKey();
    const mockError = jest.fn();
    const handlers: EventHandlers = { 'test.event': jest.fn() };

    const dispatcher = getJweEventDispatcher(mockError, handlers, keyJson);
    await dispatcher('this-is-not-a-jwe-token');

    expect(mockError).toHaveBeenCalledTimes(1);
    expect(mockError.mock.calls[0][0].error).toBe('DecryptionError');
  });

  test('calls error handler with DecryptionError, stringifying a non-Error throwable', async () => {
    const keyJson = await generateEncKey();
    const mockError: ErrorHandler = jest.fn();
    const handlers: EventHandlers = { 'test.event': jest.fn() };

    const spy = jest.spyOn(jose.JWE, 'createDecrypt').mockImplementation(() => {
      // eslint-disable-next-line @typescript-eslint/no-throw-literal
      throw 'raw-string-failure';
    });

    try {
      const dispatcher = getJweEventDispatcher(mockError, handlers, keyJson);
      await dispatcher('irrelevant-input');

      expect(mockError).toHaveBeenCalledWith({
        error: 'DecryptionError',
        message: 'Failed to decrypt event: raw-string-failure'
      });
    } finally {
      spy.mockRestore();
    }
  });

  test('calls error handler with InternalError when a TypeError occurs while decrypting', async () => {
    const keyJson = await generateEncKey();
    const mockError: ErrorHandler = jest.fn();
    const handlers: EventHandlers = { 'test.event': jest.fn() };

    const spy = jest.spyOn(jose.JWE, 'createDecrypt').mockImplementation(() => {
      throw new TypeError('boom');
    });

    try {
      const dispatcher = getJweEventDispatcher(mockError, handlers, keyJson);
      await dispatcher('irrelevant-input');

      expect(mockError).toHaveBeenCalledWith({
        error: 'InternalError',
        message: 'TypeError while parsing the event -- unencrypted event?'
      });
    } finally {
      spy.mockRestore();
    }
  });
});
