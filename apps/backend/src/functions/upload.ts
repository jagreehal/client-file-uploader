import { APIGatewayEvent, APIGatewayProxyResultV2 } from 'aws-lambda';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuid } from 'uuid';
import { z } from 'zod';
import { wrapHandler } from '@/utils/wrap-handler';
import {
  PRE_SIGNED_URL_EXPIRATION_SECONDS,
  S3_UPLOAD_KEY_PREFIX,
} from '@/config';
import { createJsonResponse } from '@/utils/create-json-response';
import { Upload } from '@/models';
import createError from 'http-errors';
import { createUpload } from '@/db';
import { getEnv } from '@/utils/get-env';
import { UploadRequest, UploadResponse } from 'schemas';

const schema = z.object({
  body: UploadRequest,
  requestContext: z.object({
    authorizer: z.object({
      email: z.string(),
    }),
  }),
});

const s3 = new S3Client({});

const uploadFn = async (event: APIGatewayEvent) => {
  const input = schema.parse(event);
  const { body, requestContext } = input;
  const id = uuid();

  const clientId = requestContext.authorizer.email;

  const upload: Upload = {
    id,
    clientId,
    ...body,
  };

  try {
    const command = new PutObjectCommand({
      Bucket: getEnv('BUCKET_NAME'),
      Key: `${S3_UPLOAD_KEY_PREFIX}/${body.type}/${clientId}/${id}`,
      ContentType: body.file.contentType,
    });

    const url = await getSignedUrl(s3, command, {
      expiresIn: PRE_SIGNED_URL_EXPIRATION_SECONDS,
    });

    await createUpload(upload);

    return createJsonResponse<UploadResponse>({
      id,
      contentType: body.file.contentType,
      url,
    });
  } catch (error) {
    console.error(error);
    throw new createError.InternalServerError();
  }
};
export const handler = wrapHandler(uploadFn, schema);
