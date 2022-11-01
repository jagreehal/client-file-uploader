import { S3Handler } from 'aws-lambda';
import { getUpload, removeUploadTTL } from '@/db';

export const handler: S3Handler = async (event): Promise<void> => {
  console.log(JSON.stringify(event, null, 2));
  for (const record of event.Records) {
    const id = record.s3.object.key.split('/').pop();
    console.log(record.s3.object.key, id);
    if (!id) {
      throw new Error(`Could not find id in key: ${record.s3.object.key}`);
    }

    const upload = await getUpload(id);

    try {
      await removeUploadTTL(upload.id);
    } catch (error) {
      console.log('ttl');
      console.error(error);
    }
  }
};
