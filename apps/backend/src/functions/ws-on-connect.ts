import * as AWS from 'aws-sdk';
import { PutItemInput } from 'aws-sdk/clients/dynamodb';

export const handler = async (event: any) => {
  const ddb = new AWS.DynamoDB.DocumentClient({});

  const putParams: PutItemInput = {
    TableName: process.env.TABLE_NAME!,
    Item: {
      connectionId: event.requestContext.connectionId,
    },
  };

  try {
    await ddb.put(putParams).promise();
  } catch (err) {
    return {
      statusCode: 500,
      body: 'Failed to connect: ' + JSON.stringify(err),
    };
  }

  return { statusCode: 200, body: 'Connected' };
};
