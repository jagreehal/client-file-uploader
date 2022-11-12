import config from '../package.json';
export const ENV = process.env.ENV || 'dev';
export const STACK_NAME = `${ENV}-${config.name}`;
export const TABLE_NAME = `${STACK_NAME}-table`;
export const AWS_REGION = process.env.AWS_REGION;
export const BUCKET_NAME = `${STACK_NAME}-s3-bucket`;
export const REST_API = `${STACK_NAME}-api`;
export const S3_UPLOAD_KEY_PREFIX = `uploads`;
export const PRE_SIGNED_URL_EXPIRATION_SECONDS = 300;
export const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS;

// event bridge
export const EVENT_S3_OBJECT_CREATED_RULE = `${STACK_NAME}-s3-object-created-rule`;
export const BUCKET_NAME_CREATED_EVENT_BRIDGE_RULE = `${STACK_NAME}-${BUCKET_NAME}-created-rule`;
export const TABLE_NAME_CREATED_EVENT_BRIDGE_RULE = `${STACK_NAME}-${TABLE_NAME}-insert-rule`;
export const EVENT_BUS_NAME = `${STACK_NAME}-event-bus`;
export const EVENT_BRIDGE_WEB_SOCKET = `${STACK_NAME}-event-bridge-web-socket`;
// es
export const WEB_SOCKET_API = `${STACK_NAME}-ws-api`;
export const WEB_SOCKET_TABLE = `${STACK_NAME}-ws-table`;
// auth
export const TOKEN_AUTHORIZER = `${STACK_NAME}-token-authorizer`;
export const AUTH0_PUBLIC_KEY = `${STACK_NAME}-AUTH0_PUBLIC_KEY`;
