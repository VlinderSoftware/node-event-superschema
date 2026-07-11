import * as jose from 'node-jose';
import { getJwsEventDispatcher } from './getJwsEventDispatcher';
import { EventHandlers } from './getEventDispatcher';

async function generateSigKey(alg: string = 'HS256'): Promise<string> {
  const keystore = jose.JWK.createKeyStore();
  const key = await keystore.generate('oct', 256, { alg, use: 'sig' });
  return JSON.stringify(key.toJSON(true));
}

async function sign(event: any, keyJson: string, algorithm: string = 'HS256'): Promise<string> {
  const keystore = jose.JWK.createKeyStore();
  const jwk = await keystore.add(keyJson, 'json');
  const signer = jose.JWS.createSign({ format: 'compact', fields: { typ: 'event', alg: algorithm } }, jwk);
  const result = await signer.update(JSON.stringify(event)).final();
  return result as unknown as string;
}

const validEvent = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  type: 'test.event',
  metadata: {
    cid: '550e8400-e29b-41d4-a716-446655440001',
    pid: '550e8400-e29b-41d4-a716-446655440002'
  }
};

describe('getJwsEventDispatcher', () => {
  test('verifies and dispatches a valid event to the correct handler', async () => {
    const keyJson = await generateSigKey();
    const signed = await sign(validEvent, keyJson);

    const mockError = jest.fn();
    const mockHandler = jest.fn();
    const handlers: EventHandlers = { 'test.event': mockHandler };

    const dispatcher = getJwsEventDispatcher(mockError, handlers, keyJson, 'HS256');
    await dispatcher(signed);

    expect(mockHandler).toHaveBeenCalledWith(mockError, validEvent);
    expect(mockError).not.toHaveBeenCalled();
  });

  test('calls error handler with VerificationError when the key does not match', async () => {
    const keyJson = await generateSigKey();
    const wrongKeyJson = await generateSigKey();
    const signed = await sign(validEvent, keyJson);

    const mockError = jest.fn();
    const handlers: EventHandlers = { 'test.event': jest.fn() };

    const dispatcher = getJwsEventDispatcher(mockError, handlers, wrongKeyJson, 'HS256');
    await dispatcher(signed);

    expect(mockError).toHaveBeenCalledTimes(1);
    const errorArg = mockError.mock.calls[0][0];
    expect(errorArg.error).toBe('VerificationError');
    expect(errorArg.message).toContain('Failed to verify event');
  });

  test('calls error handler with VerificationError for garbage input', async () => {
    const keyJson = await generateSigKey();
    const mockError = jest.fn();
    const handlers: EventHandlers = { 'test.event': jest.fn() };

    const dispatcher = getJwsEventDispatcher(mockError, handlers, keyJson, 'HS256');
    await dispatcher('this-is.not-a.valid-jws');

    expect(mockError).toHaveBeenCalledTimes(1);
    expect(mockError.mock.calls[0][0].error).toBe('VerificationError');
  });

  test('calls error handler with VerificationError, stringifying a non-Error throwable', async () => {
    const keyJson = await generateSigKey();
    const mockError = jest.fn();
    const handlers: EventHandlers = { 'test.event': jest.fn() };

    const spy = jest.spyOn(jose.JWS, 'createVerify').mockImplementation(() => {
      // eslint-disable-next-line @typescript-eslint/no-throw-literal
      throw 'raw-string-failure';
    });

    try {
      const dispatcher = getJwsEventDispatcher(mockError, handlers, keyJson, 'HS256');
      await dispatcher('irrelevant-input');

      expect(mockError).toHaveBeenCalledWith({
        error: 'VerificationError',
        message: 'Failed to verify event: raw-string-failure'
      });
    } finally {
      spy.mockRestore();
    }
  });

  test('calls error handler with InternalError when a TypeError occurs while verifying', async () => {
    const keyJson = await generateSigKey();
    const mockError = jest.fn();
    const handlers: EventHandlers = { 'test.event': jest.fn() };

    const spy = jest.spyOn(jose.JWS, 'createVerify').mockImplementation(() => {
      throw new TypeError('boom');
    });

    try {
      const dispatcher = getJwsEventDispatcher(mockError, handlers, keyJson, 'HS256');
      await dispatcher('irrelevant-input');

      expect(mockError).toHaveBeenCalledWith({
        error: 'InternalError',
        message: 'AttributeError while parsing the event -- unsigned event?'
      });
    } finally {
      spy.mockRestore();
    }
  });
});
