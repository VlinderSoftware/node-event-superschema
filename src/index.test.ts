import { describe, test, expect, vi } from 'vitest';
import * as jose from 'node-jose';

vi.mock('uuid', () => ({
  v4: vi.fn(() => '550e8400-e29b-41d4-a716-446655440099')
}));

import {
  superSchema,
  superSchemaValidator,
  getEventDispatcher,
  getSendEventFunction,
  getJweEventDispatcher,
  getJwsEventDispatcher,
  getJweSendEventFunction,
  getJwsSendEventFunction
} from './index';

describe('index', () => {
  test('re-exports all public API members', () => {
    expect(superSchema).toBeDefined();
    expect(typeof superSchemaValidator).toBe('function');
    expect(typeof getEventDispatcher).toBe('function');
    expect(typeof getSendEventFunction).toBe('function');
    expect(typeof getJweEventDispatcher).toBe('function');
    expect(typeof getJwsEventDispatcher).toBe('function');
    expect(typeof getJweSendEventFunction).toBe('function');
    expect(typeof getJwsSendEventFunction).toBe('function');
  });

  test('supports a full send/dispatch round trip over JWE', async () => {
    const keystore = jose.JWK.createKeyStore();
    const key = await keystore.generate('oct', 256, { alg: 'A256GCM', use: 'enc' });
    const keyJson = JSON.stringify(key.toJSON(true));

    let transmitted = '';
    const send = (event: string) => {
      transmitted = event;
    };

    const pid = '550e8400-e29b-41d4-a716-446655440000';
    const sendEvent = getJweSendEventFunction(send, pid, undefined, keyJson);
    await sendEvent('test.event', { hello: 'world' });

    const mockError = vi.fn();
    const mockHandler = vi.fn();
    const dispatcher = getJweEventDispatcher(mockError, { 'test.event': mockHandler }, keyJson);
    await dispatcher(transmitted);

    expect(mockError).not.toHaveBeenCalled();
    expect(mockHandler).toHaveBeenCalledTimes(1);
    const dispatchedEvent = mockHandler.mock.calls[0][1];
    expect(dispatchedEvent.type).toBe('test.event');
    expect(dispatchedEvent.data).toEqual({ hello: 'world' });
  });

  test('supports a full send/dispatch round trip over JWS', async () => {
    const keystore = jose.JWK.createKeyStore();
    const key = await keystore.generate('oct', 256, { alg: 'HS256', use: 'sig' });
    const keyJson = JSON.stringify(key.toJSON(true));

    let transmitted = '';
    const send = (event: string) => {
      transmitted = event;
    };

    const pid = '550e8400-e29b-41d4-a716-446655440000';
    const sendEvent = getJwsSendEventFunction(send, pid, keyJson, 'HS256');
    await sendEvent('test.event', { hello: 'world' });

    const mockError = vi.fn();
    const mockHandler = vi.fn();
    const dispatcher = getJwsEventDispatcher(mockError, { 'test.event': mockHandler }, keyJson, 'HS256');
    await dispatcher(transmitted);

    expect(mockError).not.toHaveBeenCalled();
    expect(mockHandler).toHaveBeenCalledTimes(1);
    const dispatchedEvent = mockHandler.mock.calls[0][1];
    expect(dispatchedEvent.type).toBe('test.event');
    expect(dispatchedEvent.data).toEqual({ hello: 'world' });
  });
});
