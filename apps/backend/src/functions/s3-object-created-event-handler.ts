import { extractId } from '@/utils/extract-id-from-key';
import { EventBridgeHandler } from 'aws-lambda';

interface Bucket {
  name: string;
}

interface Object {
  key: string;
  size: number;
  etag: string;
  sequencer: string;
}

interface Event {
  version: string;
  bucket: Bucket;
  object: Object;
  'request-id': string;
  requester: string;
  'source-ip-address': string;
  reason: string;
}

export const handler: EventBridgeHandler<
  'Object Created',
  Event,
  void
> = async (event): Promise<void> => {
  console.log(event.detail);
  const id = extractId(event.detail.object.key);
  console.log(id);
  console.log('EVENT: ' + JSON.stringify(event, null, 2));
};
