import { describe, test, expect, vi } from 'vitest';
import { getEventDispatcher, EventHandlers } from './getEventDispatcher';

describe('getEventDispatcher', () => {
  test('dispatches valid event to correct handler', () => {
    const mockError = vi.fn();
    const mockHandler = vi.fn();

    const handlers: EventHandlers = {
      'test.event': mockHandler
    };

    const dispatcher = getEventDispatcher(mockError, handlers);

    const validEvent = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      type: 'test.event',
      metadata: {
        cid: '550e8400-e29b-41d4-a716-446655440001',
        pid: '550e8400-e29b-41d4-a716-446655440002'
      }
    };

    dispatcher(validEvent);

    expect(mockHandler).toHaveBeenCalledWith(mockError, validEvent);
    expect(mockError).not.toHaveBeenCalled();
  });

  test('calls error handler for invalid event', () => {
    const mockError = vi.fn();
    const mockHandler = vi.fn();

    const handlers: EventHandlers = {
      'test.event': mockHandler
    };

    const dispatcher = getEventDispatcher(mockError, handlers);

    const invalidEvent = {
      type: 'test.event',
      metadata: {
        cid: '550e8400-e29b-41d4-a716-446655440001',
        pid: '550e8400-e29b-41d4-a716-446655440002'
      }
    };

    dispatcher(invalidEvent);

    expect(mockError).toHaveBeenCalledWith({
      error: 'SchemaMismatchError',
      message: 'Event does not match event schema'
    });
    expect(mockHandler).not.toHaveBeenCalled();
  });

  test('dispatches to base event handler when specific handler not found', () => {
    const mockError = vi.fn();
    const mockHandler = vi.fn();

    const handlers: EventHandlers = {
      'test.event': mockHandler
    };

    const dispatcher = getEventDispatcher(mockError, handlers);

    const validEvent = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      type: 'test.event:v1',
      metadata: {
        cid: '550e8400-e29b-41d4-a716-446655440001',
        pid: '550e8400-e29b-41d4-a716-446655440002'
      }
    };

    dispatcher(validEvent);

    expect(mockHandler).toHaveBeenCalledWith(mockError, validEvent);
    expect(mockError).not.toHaveBeenCalled();
  });

  test('dispatches to default handler when no matching handler found', () => {
    const mockError = vi.fn();
    const mockDefaultHandler = vi.fn();

    const handlers: EventHandlers = {
      '__default__': mockDefaultHandler
    };

    const dispatcher = getEventDispatcher(mockError, handlers);

    const validEvent = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      type: 'unknown.event',
      metadata: {
        cid: '550e8400-e29b-41d4-a716-446655440001',
        pid: '550e8400-e29b-41d4-a716-446655440002'
      }
    };

    dispatcher(validEvent);

    expect(mockDefaultHandler).toHaveBeenCalledWith(mockError, validEvent);
    expect(mockError).not.toHaveBeenCalled();
  });

  test('does nothing when no matching handler and no default handler', () => {
    const mockError = vi.fn();

    const handlers: EventHandlers = {
      'test.event': vi.fn()
    };

    const dispatcher = getEventDispatcher(mockError, handlers);

    const validEvent = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      type: 'unknown.event',
      metadata: {
        cid: '550e8400-e29b-41d4-a716-446655440001',
        pid: '550e8400-e29b-41d4-a716-446655440002'
      }
    };

    dispatcher(validEvent);

    expect(mockError).not.toHaveBeenCalled();
  });
});
