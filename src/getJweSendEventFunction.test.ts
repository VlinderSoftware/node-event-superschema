import { describe, test, expect, vi } from 'vitest';
import * as jose from 'node-jose';
import { getJweSendEventFunction } from './getJweSendEventFunction';

vi.mock('uuid', () => ({
  v4: vi.fn(() => '550e8400-e29b-41d4-a716-446655440099')
}));

async function generateEncKey(alg: string = 'A256GCM', size: number = 256): Promise<string> {
  const keystore = jose.JWK.createKeyStore();
  const key = await keystore.generate('oct', size, { alg, use: 'enc' });
  return JSON.stringify(key.toJSON(true));
}

async function decrypt(encrypted: string, keyJson: string): Promise<any> {
  const keystore = jose.JWK.createKeyStore();
  await keystore.add(keyJson, 'json');
  const result = await jose.JWE.createDecrypt(keystore).decrypt(encrypted);
  return JSON.parse(result.plaintext.toString());
}

describe('getJweSendEventFunction', () => {
  test('encrypts a properly formatted event and sends the ciphertext', async () => {
    const keyJson = await generateEncKey();
    const mockSend = vi.fn();
    const pid = '550e8400-e29b-41d4-a716-446655440000';

    const sendEvent = getJweSendEventFunction(mockSend, pid, undefined, keyJson);

    await sendEvent('test.event', { hello: 'world' });

    expect(mockSend).toHaveBeenCalledTimes(1);
    const encrypted = mockSend.mock.calls[0][0];
    expect(typeof encrypted).toBe('string');
    expect(encrypted).not.toContain('test.event');

    const decrypted = await decrypt(encrypted, keyJson);
    expect(decrypted.type).toBe('test.event');
    expect(decrypted.metadata.pid).toBe(pid);
    expect(decrypted.data).toEqual({ hello: 'world' });
  });

  test('supports a custom algorithm and encryption', async () => {
    const keyJson = await generateEncKey('A128GCM', 128);
    const mockSend = vi.fn();
    const pid = '550e8400-e29b-41d4-a716-446655440000';

    const sendEvent = getJweSendEventFunction(mockSend, pid, undefined, keyJson, 'dir', 'A128GCM');

    await sendEvent('test.event');

    const encrypted = mockSend.mock.calls[0][0];
    const decrypted = await decrypt(encrypted, keyJson);
    expect(decrypted.type).toBe('test.event');
  });

  test('applies data preprocessors before encrypting', async () => {
    const keyJson = await generateEncKey();
    const mockSend = vi.fn();
    const pid = '550e8400-e29b-41d4-a716-446655440000';
    const preprocessors = {
      'test.event': (data: any) => ({ transformed: data.value })
    };

    const sendEvent = getJweSendEventFunction(mockSend, pid, preprocessors, keyJson);

    await sendEvent('test.event', { value: 'original' });

    const encrypted = mockSend.mock.calls[0][0];
    const decrypted = await decrypt(encrypted, keyJson);
    expect(decrypted.data).toEqual({ transformed: 'original' });
  });

  test('rejects when no encryption key is provided (default empty key)', async () => {
    const mockSend = vi.fn();
    const pid = '550e8400-e29b-41d4-a716-446655440000';

    const sendEvent = getJweSendEventFunction(mockSend, pid);

    await expect(sendEvent('test.event')).rejects.toThrow();
    expect(mockSend).not.toHaveBeenCalled();
  });

  test('propagates cid, uid and token into the encrypted event metadata', async () => {
    const keyJson = await generateEncKey();
    const mockSend = vi.fn();
    const pid = '550e8400-e29b-41d4-a716-446655440000';
    const cid = '550e8400-e29b-41d4-a716-446655440001';
    const uid = '550e8400-e29b-41d4-a716-446655440002';
    const token = 'test-token';

    const sendEvent = getJweSendEventFunction(mockSend, pid, undefined, keyJson);

    await sendEvent('test.event', undefined, cid, uid, token);

    const encrypted = mockSend.mock.calls[0][0];
    const decrypted = await decrypt(encrypted, keyJson);
    expect(decrypted.metadata.cid).toBe(cid);
    expect(decrypted.metadata.uid).toBe(uid);
    expect(decrypted.metadata.token).toBe(token);
  });
});
