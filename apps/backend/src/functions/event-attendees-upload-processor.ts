import { ObjectCreatedEventS3 } from '@/models';
import { extractId } from '@/utils/extract-id-from-key';
import { getEnv } from '@/utils/get-env';
import { EventBridgeHandler } from 'aws-lambda';
import aws from 'aws-sdk';
import { PutEventsRequestEntry } from 'aws-sdk/clients/eventbridge';
import { EventAttendees } from 'schemas';
const s3 = new aws.S3();
const eventBridgeClient = new aws.EventBridge({});

export const handler: EventBridgeHandler<
  'Object Created',
  ObjectCreatedEventS3,
  void
> = async (event): Promise<void> => {
  const id = extractId(event.detail.object.key);
  console.log('id', id);
  if (!id) {
    throw new Error(`Could not get id from key ${event.detail.object.key}`);
  }

  const content = await s3
    .getObject({
      Bucket: getEnv('BUCKET_NAME'),
      Key: event.detail.object.key,
    })
    .promise();

  if (!content.Body) {
    throw new Error(`No body`);
  }

  const { body } = JSON.parse(content.Body.toString('utf-8'));
  const attendees = EventAttendees.parse(JSON.parse(body));
  console.log(attendees);

  const eventBridgeEvent: PutEventsRequestEntry = {
    Time: new Date(),
    Source: 'event-attendees-upload-processor',
    Detail: JSON.stringify(attendees),
    DetailType: 'AttendeesValidated',
  };

  const response = await eventBridgeClient
    .putEvents({
      Entries: [eventBridgeEvent],
    })
    .promise();

  console.log(`EventBridge response: ${JSON.stringify(response)}`);
};
