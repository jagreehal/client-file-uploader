#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { ClientFileUploader } from '../src/stack';
import { STACK_NAME } from '../src/config';

const app = new cdk.App();

new ClientFileUploader(app, STACK_NAME, {
  stackName: STACK_NAME,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});

app.synth();
