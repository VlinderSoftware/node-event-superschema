import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const ajv = new Ajv();
addFormats(ajv);

export const superSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    type: { type: 'string' },
    metadata: {
      type: 'object',
      properties: {
        cid: { type: 'string', format: 'uuid' },
        tid: { type: 'string', format: 'uuid' },
        pid: { type: 'string', format: 'uuid' },
        uid: { type: 'string', format: 'uuid' },
        token: { type: 'string' }
      },
      required: ['cid', 'pid']
    },
    data: { type: 'object' }
  },
  required: ['id', 'type', 'metadata']
};

export const superSchemaValidator = ajv.compile(superSchema);
