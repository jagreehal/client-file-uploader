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
import { UploadTypeEnum } from '@/models';
import { getEnv } from '@/utils/get-env';

const schema = z.object({
  body: z.object({
    type: UploadTypeEnum,
    file: z.object({
      contentType: z.string(),
      filename: z.string(),
    }),
  }),
});

type CreateUploadResponse = {
  contentType: string;
  id: string;
  url: string;
};

type Response = APIGatewayProxyResultV2<CreateUploadResponse>;

const s3 = new S3Client({});

const uploadFn = async (event: APIGatewayEvent): Promise<Response> => {
  const input = schema.parse(event);
  const { body } = input;
  const id = uuid();

  const clientId = 'ACME_CORP'; // will come from auth token

  const upload: Upload = {
    id,
    clientId,
    ...body,
  };

  try {
    const command = new PutObjectCommand({
      Bucket: getEnv('BUCKET_NAME'),
      Key: `${S3_UPLOAD_KEY_PREFIX}/${clientId}/${id}`,
      ContentType: body.file.contentType,
    });

    const url = await getSignedUrl(s3, command, {
      expiresIn: PRE_SIGNED_URL_EXPIRATION_SECONDS,
    });

    await createUpload(upload);

    return createJsonResponse<CreateUploadResponse>({
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
