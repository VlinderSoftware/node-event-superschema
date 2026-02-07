import { v4 as uuid } from 'uuid';

export type DataPreprocessor = (data: any) => any;
export type DataPreprocessors = { [eventType: string]: DataPreprocessor };

interface FormatEventOptions {
  eventType: string;
  cid?: string;
  eventId?: string;
  tid?: string;
  uid?: string;
  token?: string;
  data?: any;
}

function getFormatEventFunction(
  dataPreprocessors?: DataPreprocessors,
  pid?: string
): (options: FormatEventOptions) => any {
  const processId = pid || uuid();
  const preprocessors = dataPreprocessors || { '__default__': (a: any) => a };
  
  if (!preprocessors['__default__']) {
    preprocessors['__default__'] = (a: any) => a;
  }

  return function formatEvent(options: FormatEventOptions): any {
    const {
      eventType,
      cid,
      eventId,
      tid,
      uid,
      token,
      data
    } = options;

    let formattedData: any = null;
    
    if (data !== undefined && data !== null) {
      const preprocessor = preprocessors[eventType] || preprocessors['__default__'];
      formattedData = preprocessor(data);
    }

    const generatedEventId = eventId || uuid();
    const metadata: any = {
      cid: cid || generatedEventId,
      tid: tid || generatedEventId,
      pid: processId
    };

    if (uid) {
      metadata.uid = uid;
    }
    if (token) {
      metadata.token = token;
    }

    const formattedEvent: any = {
      id: generatedEventId,
      type: eventType,
      metadata
    };

    if (formattedData !== null) {
      formattedEvent.data = formattedData;
    }

    return formattedEvent;
  };
}

/**
 * Get a function to send properly formatted events
 * 
 * @param send - A generic function to send events on the event bus, once they're properly
 *               formatted. Should expect a dict and not return anything.
 * @param pid - Producer ID
 * @param dataPreprocessors - Optional dict mapping event types to their data preprocessors.
 *                            The data preprocessor should convert the event data to a serializable
 *                            dict conforming to the appropriate schema
 * @returns A function to send events
 */
export function getSendEventFunction(
  send: (event: any) => void,
  pid: string,
  dataPreprocessors?: DataPreprocessors
): (eventType: string, eventData?: any, cid?: string, uid?: string, token?: string) => void {
  const formatEvent = getFormatEventFunction(dataPreprocessors, pid);

  return function sendEvent(
    eventType: string,
    eventData?: any,
    cid?: string,
    uid?: string,
    token?: string
  ): void {
    const formattedEvent = formatEvent({
      eventType,
      cid,
      uid,
      token,
      data: eventData
    });
    
    send(formattedEvent);
  };
}
