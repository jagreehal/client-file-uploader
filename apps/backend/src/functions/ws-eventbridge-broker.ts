import * as AWS from 'aws-sdk';

const { TABLE_NAME, WEBSOCKET_API } = process.env;
if (!(TABLE_NAME || WEBSOCKET_API)) {
  throw new Error('Missing required environment variables');
}

const ddbTable = new AWS.DynamoDB.DocumentClient({});

const apigateway = new AWS.ApiGatewayManagementApi({
  endpoint: WEBSOCKET_API?.replace('wss', 'https'),
});

export const handler = async (event: any) => {
  let connectionData;

  try {
    connectionData = await ddbTable
      .scan({ TableName: TABLE_NAME!, ProjectionExpression: 'connectionId' })
      .promise();
  } catch (e) {
    if (e instanceof Error) {
      return { statusCode: 500, body: e.stack };
    }
    return { statusCode: 500, body: 'unknown error' };
  }

  const postCalls = connectionData.Items?.map(async ({ connectionId }: any) => {
    try {
      const result = await apigateway
        .postToConnection({
          ConnectionId: connectionId,
          Data: JSON.stringify(event),
        })
        .promise();
    } catch (e) {
      // @ts-ignore
      if (e.statusCode === 410) {
        await ddbTable
          .delete({ TableName: TABLE_NAME!, Key: { connectionId } })
          .promise();
      } else {
        throw e;
      }
    }
  });

  try {
    await Promise.all(postCalls!);
  } catch (e) {
    console.error(e);
    return {
      statusCode: 500,
      // @ts-ignore
      body: e.stack,
    };
  }

  return { statusCode: 200, body: 'Data sent.' };
};
