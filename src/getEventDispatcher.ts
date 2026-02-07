import { superSchemaValidator } from './superSchema';

export interface ErrorMessage {
  error: string;
  message: string;
}

export type ErrorHandler = (err: ErrorMessage) => void;
export type EventHandler = (err: ErrorHandler, event: any) => void;
export type EventHandlers = { [eventType: string]: EventHandler };

/**
 * Get an event dispatcher
 * 
 * @param err - Error handler. Receives an error message that, if it comes from this module,
 *              will contain at least an 'error' and a 'message' field
 * @param handlers - Handlers for the event. For each event type to handle, it should have a function
 *                   that takes the event as an argument. Only one handler per event is permitted.
 *                   Exceptions are not caught. If no specific handler is available and a '__default__'
 *                   handler is included in the handlers, that handler will be called by the dispatcher.
 * @returns A dispatcher that will validate incoming events against the super-schema and call the
 *          appropriate event handler if one is available.
 */
export function getEventDispatcher(
  err: ErrorHandler,
  handlers: EventHandlers
): (event: any) => void {
  return function dispatch(event: any): void {
    const isValid = superSchemaValidator(event);
    
    if (!isValid) {
      err({
        error: 'SchemaMismatchError',
        message: 'Event does not match event schema'
      });
      return;
    }

    const eventType = event.type as string;
    const baseEventName = eventType.split(':').slice(0, -1).join(':');

    if (handlers[eventType]) {
      handlers[eventType](err, event);
    } else if (baseEventName && handlers[baseEventName]) {
      handlers[baseEventName](err, event);
    } else if (handlers['__default__']) {
      handlers['__default__'](err, event);
    }
  };
}
