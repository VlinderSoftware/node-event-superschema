import { getSendEventFunction } from './getSendEventFunction';

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn(() => '550e8400-e29b-41d4-a716-446655440099')
}));

describe('getSendEventFunction', () => {
  test('sends a properly formatted event', () => {
    const mockSend = jest.fn();
    const pid = '550e8400-e29b-41d4-a716-446655440000';

    const sendEvent = getSendEventFunction(mockSend, pid);

    sendEvent('test.event');

    expect(mockSend).toHaveBeenCalledTimes(1);
    const sentEvent = mockSend.mock.calls[0][0];

    expect(sentEvent).toHaveProperty('id');
    expect(sentEvent.type).toBe('test.event');
    expect(sentEvent.metadata.pid).toBe(pid);
    expect(sentEvent.metadata).toHaveProperty('cid');
    expect(sentEvent.metadata).toHaveProperty('tid');
  });

  test('sends event with custom cid and uid', () => {
    const mockSend = jest.fn();
    const pid = '550e8400-e29b-41d4-a716-446655440000';
    const cid = '550e8400-e29b-41d4-a716-446655440001';
    const uid = '550e8400-e29b-41d4-a716-446655440002';

    const sendEvent = getSendEventFunction(mockSend, pid);

    sendEvent('test.event', null, cid, uid);

    const sentEvent = mockSend.mock.calls[0][0];

    expect(sentEvent.metadata.cid).toBe(cid);
    expect(sentEvent.metadata.uid).toBe(uid);
  });

  test('sends event with token', () => {
    const mockSend = jest.fn();
    const pid = '550e8400-e29b-41d4-a716-446655440000';
    const token = 'test-token';

    const sendEvent = getSendEventFunction(mockSend, pid);

    sendEvent('test.event', null, undefined, undefined, token);

    const sentEvent = mockSend.mock.calls[0][0];

    expect(sentEvent.metadata.token).toBe(token);
  });

  test('sends event with data', () => {
    const mockSend = jest.fn();
    const pid = '550e8400-e29b-41d4-a716-446655440000';
    const eventData = { test: 'data' };

    const sendEvent = getSendEventFunction(mockSend, pid);

    sendEvent('test.event', eventData);

    const sentEvent = mockSend.mock.calls[0][0];

    expect(sentEvent.data).toEqual(eventData);
  });

  test('preprocesses data with custom preprocessor', () => {
    const mockSend = jest.fn();
    const pid = '550e8400-e29b-41d4-a716-446655440000';
    const eventData = { value: 'original' };
    const preprocessedData = { value: 'preprocessed' };

    const preprocessors = {
      'test.event': (data: any) => preprocessedData
    };

    const sendEvent = getSendEventFunction(mockSend, pid, preprocessors);

    sendEvent('test.event', eventData);

    const sentEvent = mockSend.mock.calls[0][0];

    expect(sentEvent.data).toEqual(preprocessedData);
  });

  test('falls back to an identity preprocessor when preprocessors lacks __default__', () => {
    const mockSend = jest.fn();
    const pid = '550e8400-e29b-41d4-a716-446655440000';
    const eventData = { value: 'unchanged' };

    const preprocessors = {
      'other.event': (data: any) => ({ ...data, processed: true })
    };

    const sendEvent = getSendEventFunction(mockSend, pid, preprocessors);

    sendEvent('test.event', eventData);

    const sentEvent = mockSend.mock.calls[0][0];

    expect(sentEvent.data).toEqual(eventData);
  });

  test('uses default preprocessor when no specific preprocessor exists', () => {
    const mockSend = jest.fn();
    const pid = '550e8400-e29b-41d4-a716-446655440000';
    const eventData = { value: 'data' };

    const preprocessors = {
      '__default__': (data: any) => ({ ...data, processed: true })
    };

    const sendEvent = getSendEventFunction(mockSend, pid, preprocessors);

    sendEvent('test.event', eventData);

    const sentEvent = mockSend.mock.calls[0][0];

    expect(sentEvent.data).toEqual({ value: 'data', processed: true });
  });

  test('generates event IDs for each event', () => {
    const mockSend = jest.fn();
    const pid = '550e8400-e29b-41d4-a716-446655440000';

    const sendEvent = getSendEventFunction(mockSend, pid);

    sendEvent('test.event1');
    sendEvent('test.event2');

    const event1 = mockSend.mock.calls[0][0];
    const event2 = mockSend.mock.calls[1][0];

    expect(event1.id).toBeDefined();
    expect(event2.id).toBeDefined();
  });

  test('generates a process ID when pid is an empty string', () => {
    const mockSend = jest.fn();

    const sendEvent = getSendEventFunction(mockSend, '');

    sendEvent('test.event');

    const sentEvent = mockSend.mock.calls[0][0];

    expect(sentEvent.metadata.pid).toBe('550e8400-e29b-41d4-a716-446655440099');
  });

  test('uses event ID as cid and tid when not provided', () => {
    const mockSend = jest.fn();
    const pid = '550e8400-e29b-41d4-a716-446655440000';

    const sendEvent = getSendEventFunction(mockSend, pid);

    sendEvent('test.event');

    const sentEvent = mockSend.mock.calls[0][0];

    expect(sentEvent.metadata.cid).toBe(sentEvent.id);
    expect(sentEvent.metadata.tid).toBe(sentEvent.id);
  });
});
