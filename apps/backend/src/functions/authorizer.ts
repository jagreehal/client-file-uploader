import jwt from 'jsonwebtoken';

const generatePolicy = (principalId: string, methodArn: string) => {
  const apiGatewayWildcard = methodArn.split('/', 2).join('/') + '/*';

  return {
    principalId,
    policyDocument: {
      Version: '2012-10-17',
      Statement: [
        {
          Action: 'execute-api:Invoke',
          Effect: 'Allow',
          Resource: apiGatewayWildcard,
        },
      ],
    },
  };
};

export async function authorizer(event: any) {
  if (!event.authorizationToken) {
    throw 'Unauthorized';
  }
  const token = event.authorizationToken.replace('Bearer ', '');
  try {
    const claims = jwt.verify(token, process.env.AUTH0_PUBLIC_KEY!);
    console.log('claims', claims);
    if (typeof claims.sub !== 'string') {
      throw 'Unauthorized';
    }

    const policy = generatePolicy(claims.sub, event.methodArn);

    return {
      ...policy,
      context: claims,
    };
  } catch (error) {
    throw 'Unauthorized';
  }
}

export const handler = authorizer;
