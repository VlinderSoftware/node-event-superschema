/**
 * Event super-schema and supporting functions for Node.js/TypeScript
 * 
 * This module provides support for a generic super-schema for event handling,
 * including validation, dispatching, and sending of events with optional
 * encryption (JWE) and signing (JWS) support.
 */

export { superSchema, superSchemaValidator } from './superSchema';
export { 
  getEventDispatcher, 
  type ErrorHandler, 
  type EventHandler, 
  type EventHandlers,
  type ErrorMessage
} from './getEventDispatcher';
export { 
  getSendEventFunction,
  type DataPreprocessor,
  type DataPreprocessors
} from './getSendEventFunction';
export { getJweEventDispatcher } from './getJweEventDispatcher';
export { getJwsEventDispatcher } from './getJwsEventDispatcher';
export { getJweSendEventFunction } from './getJweSendEventFunction';
export { getJwsSendEventFunction } from './getJwsSendEventFunction';
