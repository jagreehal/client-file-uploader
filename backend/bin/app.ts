#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { ClientFileUploader } from '../src/stack';

const app = new cdk.App();

new ClientFileUploader(app, 'client-file-uploader-dev', {
  stackName: 'client-file-uploader-dev',
});

new ClientFileUploader(app, 'client-file-uploader-qa', {
  stackName: 'client-file-uploader-qa',
});

new ClientFileUploader(app, 'client-file-uploader-prod', {
  stackName: 'client-file-uploader-prod',
});
app.synth();
