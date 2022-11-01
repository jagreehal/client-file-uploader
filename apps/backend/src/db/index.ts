import { TABLE_NAME } from '@/config';
import {
  DocumentClient,
  dynamodbClient as _dynamodbClient,
} from '@/utils/dynamo-db-client';
import { Upload } from '@/models';
import { PRE_SIGNED_URL_EXPIRATION_SECONDS } from '@/config';

type DynamodbOptions = {
  dynamodbClient: DocumentClient;
};

const DEFAULT_DYNAMODB_OPTIONS: DynamodbOptions = {
  dynamodbClient: _dynamodbClient,
};

export async function createUpload(
  upload: Upload,
  { dynamodbClient }: DynamodbOptions = DEFAULT_DYNAMODB_OPTIONS
) {
  return dynamodbClient
    .put({
      TableName: TABLE_NAME,
      Item: {
        ...upload,
        ttl: Math.floor(Date.now() / 1000) + PRE_SIGNED_URL_EXPIRATION_SECONDS,
      },
    })
    .promise();
}

export async function removeUploadTTL(
  id: string,
  { dynamodbClient }: DynamodbOptions = DEFAULT_DYNAMODB_OPTIONS
) {
  return dynamodbClient
    .update({
      TableName: TABLE_NAME,
      Key: {
        id,
      },
      ExpressionAttributeNames: {
        '#ttl': 'ttl',
      },
      UpdateExpression: 'REMOVE #ttl',
    })
    .promise();
}

export async function getUpload(
  id: string,
  { dynamodbClient }: DynamodbOptions = DEFAULT_DYNAMODB_OPTIONS
) {
  const { Item } = await dynamodbClient
    .get({
      TableName: TABLE_NAME,
      Key: {
        id,
      },
    })
    .promise();
  return Item as Upload;
}
