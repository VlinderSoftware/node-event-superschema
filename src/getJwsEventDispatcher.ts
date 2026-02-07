import * as jose from 'node-jose';
import { getEventDispatcher, ErrorHandler, EventHandlers } from './getEventDispatcher';

/**
 * Get a JWS (signed) event dispatcher
 * 
 * @param err - Error handler
 * @param handlers - Event handlers
 * @param key - Verification key
 * @param algorithm - Signing algorithm
 * @returns A dispatcher that verifies JWS events and dispatches them
 */
export function getJwsEventDispatcher(
  err: ErrorHandler,
  handlers: EventHandlers,
  key: string,
  algorithm: string
): (signedEvent: string) => Promise<void> {
  const innerDispatcher = getEventDispatcher(err, handlers);

  return async function dispatch(signedEvent: string): Promise<void> {
    try {
      const keystore = jose.JWK.createKeyStore();
      await keystore.add(key, 'json');
      const result = await jose.JWS.createVerify(keystore, { algorithms: [algorithm] }).verify(signedEvent);
      const decodedEvent = JSON.parse(result.payload.toString());
      innerDispatcher(decodedEvent);
    } catch (error) {
      if (error instanceof Error && error.name === 'TypeError') {
        err({
          error: 'InternalError',
          message: 'AttributeError while parsing the event -- unsigned event?'
        });
      } else {
        err({
          error: 'VerificationError',
          message: `Failed to verify event: ${error instanceof Error ? error.message : String(error)}`
        });
      }
    }
  };
}
