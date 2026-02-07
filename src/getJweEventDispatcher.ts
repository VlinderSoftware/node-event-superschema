import * as jose from 'node-jose';
import { getEventDispatcher, ErrorHandler, EventHandlers } from './getEventDispatcher';

/**
 * Get a JWE (encrypted) event dispatcher
 * 
 * @param err - Error handler
 * @param handlers - Event handlers
 * @param key - Decryption key
 * @returns A dispatcher that decrypts JWE events and dispatches them
 */
export function getJweEventDispatcher(
  err: ErrorHandler,
  handlers: EventHandlers,
  key: string
): (encryptedEvent: string) => Promise<void> {
  const innerDispatcher = getEventDispatcher(err, handlers);

  return async function dispatch(encryptedEvent: string): Promise<void> {
    try {
      const keystore = jose.JWK.createKeyStore();
      await keystore.add(key, 'json');
      const result = await jose.JWE.createDecrypt(keystore).decrypt(encryptedEvent);
      const decryptedEvent = JSON.parse(result.plaintext.toString());
      innerDispatcher(decryptedEvent);
    } catch (error) {
      if (error instanceof TypeError) {
        err({
          error: 'InternalError',
          message: 'TypeError while parsing the event -- unencrypted event?'
        });
      } else {
        err({
          error: 'DecryptionError',
          message: `Failed to decrypt event: ${error instanceof Error ? error.message : String(error)}`
        });
      }
    }
  };
}
