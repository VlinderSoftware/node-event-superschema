# node-event-superschema

Node.js/TypeScript implementation of the event superschema library.

## Overview

This library provides support for a generic super-schema for event handling, including:
- Event validation against a standardized schema
- Event dispatching with type-based routing
- Event formatting and sending
- Optional JWE (encryption) and JWS (signing) support

## Installation

```bash
npm install @vlindersoftware/node-event-superschema
```

## Usage

### Basic Event Dispatching

```typescript
import { getEventDispatcher } from '@vlindersoftware/node-event-superschema';

const errorHandler = (err) => {
  console.error('Error:', err);
};

const handlers = {
  'purchase.order.created': (err, event) => {
    console.log('Purchase order created:', event.data);
  },
  '__default__': (err, event) => {
    console.log('Unhandled event:', event.type);
  }
};

const dispatcher = getEventDispatcher(errorHandler, handlers);

// Dispatch an event
dispatcher({
  id: '550e8400-e29b-41d4-a716-446655440000',
  type: 'purchase.order.created',
  metadata: {
    cid: '550e8400-e29b-41d4-a716-446655440001',
    pid: '550e8400-e29b-41d4-a716-446655440002'
  },
  data: { orderId: '12345' }
});
```

### Sending Events

```typescript
import { getSendEventFunction } from '@vlindersoftware/node-event-superschema';

const sendToQueue = (event) => {
  // Send to your event bus/queue
  console.log('Sending:', event);
};

const pid = '550e8400-e29b-41d4-a716-446655440000';
const sendEvent = getSendEventFunction(sendToQueue, pid);

// Send an event
sendEvent('purchase.order.created', { orderId: '12345' });
```

### Event Schema

All events must conform to the following super-schema:

```json
{
  "id": "uuid",
  "type": "string",
  "metadata": {
    "cid": "uuid",
    "tid": "uuid",
    "pid": "uuid",
    "uid": "uuid (optional)",
    "token": "string (optional)"
  },
  "data": "object (optional)"
}
```

### JWE (Encrypted) Events

```typescript
import { getJweEventDispatcher, getJweSendEventFunction } from '@vlindersoftware/node-event-superschema';

// For dispatching encrypted events
const jweDispatcher = getJweEventDispatcher(errorHandler, handlers, encryptionKey);

// For sending encrypted events
const jweSendEvent = await getJweSendEventFunction(
  sendToQueue,
  pid,
  dataPreprocessors,
  encryptionKey
);
```

### JWS (Signed) Events

```typescript
import { getJwsEventDispatcher, getJwsSendEventFunction } from '@vlindersoftware/node-event-superschema';

// For dispatching signed events
const jwsDispatcher = getJwsEventDispatcher(errorHandler, handlers, signingKey, 'HS256');

// For sending signed events
const jwsSendEvent = await getJwsSendEventFunction(
  sendToQueue,
  pid,
  signingKey,
  'HS256',
  dataPreprocessors
);
```

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## License

ISC
