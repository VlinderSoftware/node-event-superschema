import * as jose from 'node-jose';
import { getSendEventFunction, DataPreprocessors } from './getSendEventFunction';

/**
 * Get a function to send JWE (encrypted) events
 * 
 * @param send - A generic function to send events on the event bus
 * @param pid - Producer ID
 * @param dataPreprocessors - Optional dict mapping event types to their data preprocessors
 * @param key - Encryption key
 * @param algorithm - Encryption algorithm (default: 'dir')
 * @param encryption - Content encryption algorithm (default: 'A256GCM')
 * @returns A function to send encrypted events
 */
export function getJweSendEventFunction(
  send: (event: string) => void,
  pid: string,
  dataPreprocessors?: DataPreprocessors,
  key: string = '',
  algorithm: string = 'dir',
  encryption: string = 'A256GCM'
): (eventType: string, eventData?: any, cid?: string, uid?: string, token?: string) => Promise<void> {
  async function encryptThenSend(formattedEvent: any): Promise<void> {
    const keystore = jose.JWK.createKeyStore();
    const jwk = await keystore.add(key, 'json');
    const encryptor = jose.JWE.createEncrypt({ format: 'compact', fields: { alg: algorithm, enc: encryption } }, jwk);
    const encrypted = await encryptor.update(JSON.stringify(formattedEvent)).final();
    send(encrypted);
  }

  const innerSend = getSendEventFunction(encryptThenSend as any, pid, dataPreprocessors);

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
