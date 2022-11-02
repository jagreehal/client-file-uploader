import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { createLambdaFunction } from './utils/create-lambda-function';
import { Cors, LambdaIntegration, RestApi } from 'aws-cdk-lib/aws-apigateway';

import {
  BUCKET_NAME,
  EVENT_BUS_NAME,
  EVENT_S3_OBJECT_CREATED_RULE,
  REST_API,
  S3_UPLOAD_KEY_PREFIX,
  TABLE_NAME,
} from './config';
import { S3EventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { EventBus, Rule } from 'aws-cdk-lib/aws-events';
import { LambdaFunction } from 'aws-cdk-lib/aws-events-targets';
import { UploadTypes } from 'schemas';

interface ClientUploaderProps extends cdk.StackProps {}

export class ClientFileUploader extends cdk.Stack {
  constructor(app: cdk.App, id: string, props?: ClientUploaderProps) {
    super(app, id, props);

    const bus = EventBus.fromEventBusName(this, `bus`, 'default');

    const uploadsTable = new dynamodb.Table(this, TABLE_NAME, {
      partitionKey: {
        name: 'id',
        type: dynamodb.AttributeType.STRING,
      },
      tableName: TABLE_NAME,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    });

    const s3Bucket = new s3.Bucket(this, BUCKET_NAME, {
      bucketName: BUCKET_NAME,
      publicReadAccess: false,
      autoDeleteObjects: true,
      eventBridgeEnabled: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      // transferAcceleration: true,
      lifecycleRules: [
        {
          prefix: S3_UPLOAD_KEY_PREFIX,
          expiration: cdk.Duration.days(1),
          enabled: true,
        },
      ],
      cors: [
        {
          allowedOrigins: Cors.ALL_ORIGINS,
          allowedMethods: [s3.HttpMethods.PUT],
          exposedHeaders: ['ETag'],
          maxAge: 3000,
          allowedHeaders: ['*'],
        },
      ],
    });

    const api = new RestApi(this, REST_API, {
      defaultCorsPreflightOptions: {
        allowHeaders: Cors.DEFAULT_HEADERS,
        allowMethods: Cors.ALL_METHODS,
        allowCredentials: true,
        allowOrigins: Cors.ALL_ORIGINS,
      },
    });

    const uploadFn = createLambdaFunction({
      scope: this,
      id: 'upload',
      props: {
        environment: {
          BUCKET_NAME: s3Bucket.bucketName,
          TABLE_NAME: uploadsTable.tableName,
        },
      },
    });
    uploadsTable.grant(uploadFn, 'dynamodb:PutItem');
    s3Bucket.grantReadWrite(uploadFn);

    const upload = api.root.addResource('uploads');
    upload.addMethod('POST', new LambdaIntegration(uploadFn));

    const uploadProcessorFn = createLambdaFunction({
      scope: this,
      id: 'upload-processor',
      props: {
        environment: {
          PTC_BUCKET_NAME: s3Bucket.bucketName,
        },
      },
    });
    uploadsTable.grant(uploadProcessorFn, 'dynamodb:GetItem');
    uploadsTable.grant(uploadProcessorFn, 'dynamodb:UpdateItem');
    uploadProcessorFn.addEventSource(
      new S3EventSource(s3Bucket, {
        events: [s3.EventType.OBJECT_CREATED_PUT],
        filters: [{ prefix: S3_UPLOAD_KEY_PREFIX }],
      })
    );

    const s3ObjectCreatedEventHandlerFn = createLambdaFunction({
      scope: this,
      id: 's3-object-created-event-handler',
      props: {},
    });

    new Rule(this, EVENT_S3_OBJECT_CREATED_RULE, {
      eventPattern: {
        source: ['aws.s3'],
        detailType: ['Object Created'],
        resources: [s3Bucket.bucketArn],
      },
      targets: [new LambdaFunction(s3ObjectCreatedEventHandlerFn)],
    });

    const eventAttendeesUploadProcessorFn = createLambdaFunction({
      scope: this,
      id: 'event-attendees-upload-processor',
      props: {
        environment: {
          BUCKET_NAME: s3Bucket.bucketName,
        },
      },
    });
    s3Bucket.grantRead(eventAttendeesUploadProcessorFn);
    bus.grantPutEventsTo(eventAttendeesUploadProcessorFn);

    new Rule(this, `${UploadTypes['event-attendees']}-rule`, {
      eventPattern: {
        source: ['aws.s3'],
        detailType: ['Object Created'],
        resources: [s3Bucket.bucketArn],
        detail: {
          object: {
            key: [
              {
                prefix: `${S3_UPLOAD_KEY_PREFIX}/${UploadTypes['event-attendees']}`,
              },
            ],
          },
        },
      },
      targets: [new LambdaFunction(eventAttendeesUploadProcessorFn)],
    });

    new cdk.CfnOutput(this, 'API_URL', {
      value: api.url,
    });

    app.synth();
  }
}
