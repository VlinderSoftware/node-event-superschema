import { describe, test, expect, vi } from 'vitest';
import * as jose from 'node-jose';
import { getJwsSendEventFunction } from './getJwsSendEventFunction';

vi.mock('uuid', () => ({
  v4: vi.fn(() => '550e8400-e29b-41d4-a716-446655440099')
}));

async function generateSigKey(alg: string = 'HS256', size: number = 256): Promise<string> {
  const keystore = jose.JWK.createKeyStore();
  const key = await keystore.generate('oct', size, { alg, use: 'sig' });
  return JSON.stringify(key.toJSON(true));
}

async function verify(signed: string, keyJson: string, alg: string = 'HS256'): Promise<any> {
  const keystore = jose.JWK.createKeyStore();
  await keystore.add(keyJson, 'json');
  const result = await jose.JWS.createVerify(keystore, { algorithms: [alg] }).verify(signed);
  return JSON.parse(result.payload.toString());
}

describe('getJwsSendEventFunction', () => {
  test('signs a properly formatted event and sends the compact JWS', async () => {
    const keyJson = await generateSigKey();
    const mockSend = vi.fn();
    const pid = '550e8400-e29b-41d4-a716-446655440000';

    const sendEvent = getJwsSendEventFunction(mockSend, pid, keyJson, 'HS256');

    await sendEvent('test.event', { hello: 'world' });

    expect(mockSend).toHaveBeenCalledTimes(1);
    const signed = mockSend.mock.calls[0][0];
    expect(typeof signed).toBe('string');
    expect(signed.split('.')).toHaveLength(3);

    const verified = await verify(signed, keyJson);
    expect(verified.type).toBe('test.event');
    expect(verified.metadata.pid).toBe(pid);
    expect(verified.data).toEqual({ hello: 'world' });
  });

  test('supports a different signing algorithm', async () => {
    const keyJson = await generateSigKey('HS384', 384);
    const mockSend = vi.fn();
    const pid = '550e8400-e29b-41d4-a716-446655440000';

    const sendEvent = getJwsSendEventFunction(mockSend, pid, keyJson, 'HS384');

    await sendEvent('test.event');

    const signed = mockSend.mock.calls[0][0];
    const verified = await verify(signed, keyJson, 'HS384');
    expect(verified.type).toBe('test.event');
  });

  test('applies data preprocessors before signing', async () => {
    const keyJson = await generateSigKey();
    const mockSend = vi.fn();
    const pid = '550e8400-e29b-41d4-a716-446655440000';
    const preprocessors = {
      'test.event': (data: any) => ({ transformed: data.value })
    };

    const sendEvent = getJwsSendEventFunction(mockSend, pid, keyJson, 'HS256', preprocessors);

    await sendEvent('test.event', { value: 'original' });

    const signed = mockSend.mock.calls[0][0];
    const verified = await verify(signed, keyJson);
    expect(verified.data).toEqual({ transformed: 'original' });
  });

  test('propagates cid, uid and token into the signed event metadata', async () => {
    const keyJson = await generateSigKey();
    const mockSend = vi.fn();
    const pid = '550e8400-e29b-41d4-a716-446655440000';
    const cid = '550e8400-e29b-41d4-a716-446655440001';
    const uid = '550e8400-e29b-41d4-a716-446655440002';
    const token = 'test-token';

    const sendEvent = getJwsSendEventFunction(mockSend, pid, keyJson, 'HS256');

    await sendEvent('test.event', undefined, cid, uid, token);

    const signed = mockSend.mock.calls[0][0];
    const verified = await verify(signed, keyJson);
    expect(verified.metadata.cid).toBe(cid);
    expect(verified.metadata.uid).toBe(uid);
    expect(verified.metadata.token).toBe(token);
  });
});
