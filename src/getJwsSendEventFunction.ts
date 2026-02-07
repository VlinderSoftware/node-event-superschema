import * as jose from 'node-jose';
import { getSendEventFunction, DataPreprocessors } from './getSendEventFunction';

/**
 * Get a function to send JWS (signed) events
 * 
 * @param send - A generic function to send events on the event bus
 * @param pid - Producer ID
 * @param key - Signing key
 * @param algorithm - Signing algorithm
 * @param dataPreprocessors - Optional dict mapping event types to their data preprocessors
 * @returns A function to send signed events
 */
export function getJwsSendEventFunction(
  send: (event: string) => void,
  pid: string,
  key: string,
  algorithm: string,
  dataPreprocessors?: DataPreprocessors
): (eventType: string, eventData?: any, cid?: string, uid?: string, token?: string) => Promise<void> {
  async function signThenSend(formattedEvent: any): Promise<void> {
    const keystore = jose.JWK.createKeyStore();
    const jwk = await keystore.add(key, 'json');
    const signer = jose.JWS.createSign({ format: 'compact', fields: { typ: 'event', alg: algorithm } }, jwk);
    const result = await signer.update(JSON.stringify(formattedEvent)).final();
    send(result as any);
  }

  const innerSend = getSendEventFunction(signThenSend as any, pid, dataPreprocessors);

  return async function sendEvent(
    eventType: string,
    eventData?: any,
    cid?: string,
    uid?: string,
    token?: string
  ): Promise<void> {
    innerSend(eventType, eventData, cid, uid, token);
  };
}
