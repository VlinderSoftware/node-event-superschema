import { superSchemaValidator } from './superSchema';

describe('superSchema', () => {
  test('validates a valid event', () => {
    const validEvent = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      type: 'test.event',
      metadata: {
        cid: '550e8400-e29b-41d4-a716-446655440001',
        pid: '550e8400-e29b-41d4-a716-446655440002'
      }
    };

    expect(superSchemaValidator(validEvent)).toBe(true);
  });

  test('validates a valid event with optional fields', () => {
    const validEvent = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      type: 'test.event',
      metadata: {
        cid: '550e8400-e29b-41d4-a716-446655440001',
        tid: '550e8400-e29b-41d4-a716-446655440003',
        pid: '550e8400-e29b-41d4-a716-446655440002',
        uid: '550e8400-e29b-41d4-a716-446655440004',
        token: 'test-token'
      },
      data: {
        test: 'value'
      }
    };

    expect(superSchemaValidator(validEvent)).toBe(true);
  });

  test('rejects event without id', () => {
    const invalidEvent = {
      type: 'test.event',
      metadata: {
        cid: '550e8400-e29b-41d4-a716-446655440001',
        pid: '550e8400-e29b-41d4-a716-446655440002'
      }
    };

    expect(superSchemaValidator(invalidEvent)).toBe(false);
  });

  test('rejects event without type', () => {
    const invalidEvent = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      metadata: {
        cid: '550e8400-e29b-41d4-a716-446655440001',
        pid: '550e8400-e29b-41d4-a716-446655440002'
      }
    };

    expect(superSchemaValidator(invalidEvent)).toBe(false);
  });

  test('rejects event without metadata', () => {
    const invalidEvent = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      type: 'test.event'
    };

    expect(superSchemaValidator(invalidEvent)).toBe(false);
  });

  test('rejects event without cid in metadata', () => {
    const invalidEvent = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      type: 'test.event',
      metadata: {
        pid: '550e8400-e29b-41d4-a716-446655440002'
      }
    };

    expect(superSchemaValidator(invalidEvent)).toBe(false);
  });

  test('rejects event without pid in metadata', () => {
    const invalidEvent = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      type: 'test.event',
      metadata: {
        cid: '550e8400-e29b-41d4-a716-446655440001'
      }
    };

    expect(superSchemaValidator(invalidEvent)).toBe(false);
  });

  test('rejects event with invalid UUID format', () => {
    const invalidEvent = {
      id: 'not-a-uuid',
      type: 'test.event',
      metadata: {
        cid: '550e8400-e29b-41d4-a716-446655440001',
        pid: '550e8400-e29b-41d4-a716-446655440002'
      }
    };

    expect(superSchemaValidator(invalidEvent)).toBe(false);
  });
});
