import { Construct } from 'constructs';
import { WEB_SOCKET_API, WEB_SOCKET_TABLE } from './config';
import { WebSocketApi, WebSocketStage } from '@aws-cdk/aws-apigatewayv2-alpha';
import { WebSocketLambdaIntegration } from '@aws-cdk/aws-apigatewayv2-integrations-alpha';
import { RemovalPolicy, Stack } from 'aws-cdk-lib';
import { EventPattern, IEventBus, Rule } from 'aws-cdk-lib/aws-events';
import { LambdaFunction } from 'aws-cdk-lib/aws-events-targets';
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

import { createLambdaFunction } from './utils/create-lambda-function';

export interface EventBridgeWebSocketProps {
  readonly bus: IEventBus;
  readonly stage?: string;
  readonly eventPattern?: EventPattern;
}

export class EventBridgeWebSocket extends Construct {
  webSocketEndpoint: string;
  constructor(scope: Construct, id: string, config: EventBridgeWebSocketProps) {
    super(scope, id);

    const region = Stack.of(this).region;
    const accountId = Stack.of(this).account;
    const stage = config.stage || 'prod';

    const api = new WebSocketApi(this, WEB_SOCKET_API, {
      apiName: WEB_SOCKET_API,
    });

    const wsTable = new dynamodb.Table(this, WEB_SOCKET_TABLE, {
      tableName: WEB_SOCKET_TABLE,
      partitionKey: {
        name: 'connectionId',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const onConnectFn = createLambdaFunction({
      scope: this,
      id: 'ws-on-connect',
      props: {
        environment: {
          TABLE_NAME: wsTable.tableName,
        },
      },
    });
    wsTable.grantReadWriteData(onConnectFn);
    const onDisconnectFn = createLambdaFunction({
      scope: this,
      id: 'ws-on-disconnect',
      props: {
        environment: {
          TABLE_NAME: wsTable.tableName,
        },
      },
    });
    wsTable.grantReadWriteData(onDisconnectFn);

    this.webSocketEndpoint = `${api.apiEndpoint}/${stage}`;
    const eventBridgeBrokerFn = createLambdaFunction({
      scope: this,
      id: 'ws-eventbridge-broker',
      props: {
        environment: {
          TABLE_NAME: wsTable.tableName,
          WEBSOCKET_API: this.webSocketEndpoint,
        },
        initialPolicy: [
          new PolicyStatement({
            actions: ['execute-api:ManageConnections'],
            resources: [
              `arn:aws:execute-api:${region}:${accountId}:${api.apiId}/*`,
            ],
            effect: Effect.ALLOW,
          }),
        ],
      },
    });
    wsTable.grantReadWriteData(eventBridgeBrokerFn);

    // create routes for API Gateway
    api.addRoute('$connect', {
      integration: new WebSocketLambdaIntegration(
        'ConnectIntegration',
        onConnectFn
      ),
    });
    api.addRoute('$disconnect', {
      integration: new WebSocketLambdaIntegration(
        'DisconnectIntegration',
        onDisconnectFn
      ),
    });

    new WebSocketStage(this, `${WEB_SOCKET_API}-stage`, {
      autoDeploy: true,
      stageName: stage,
      webSocketApi: api,
    });

    new Rule(this, `WebsocketRule`, {
      eventBus: config.bus,
      eventPattern: config.eventPattern,
      targets: [new LambdaFunction(eventBridgeBrokerFn)],
    });
  }
}
