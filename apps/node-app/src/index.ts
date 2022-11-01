import * as path from 'path';
import * as dotenv from 'dotenv'; // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
dotenv.config();

const UPLOAD_URL = process.env.UPLOAD_URL;
if (!UPLOAD_URL) {
  throw new Error('UPLOAD_URL must be defined');
}

import { Uploader } from 'client-sdk';

const uploader = new Uploader(UPLOAD_URL);

function createFilePath(fileName: string) {
  return path.join(__dirname, '../sample-files', fileName);
}

// https://webhook.site/#!/b29440ea-1414-48ad-9c70-737cf7418861
async function uploadImage() {
  const file = createFilePath('hot-air-balloon-g09fb9d553_640.jpg');

  const id = await uploader.uploadImage({
    file,
    callbackUrl: 'https://webhook.site/b29440ea-1414-48ad-9c70-737cf7418861',
  });

  return id;
}

// https://webhook.site/#!/6101c48f-c38e-423c-a6de-3b4eaad54620
async function uploadEventAttendees() {
  const file = createFilePath('event-attendees.json');

  const id = await uploader.uploadEventAttendees({
    file,
    callbackUrl: 'https://webhook.site/6101c48f-c38e-423c-a6de-3b4eaad54620',
  });

  return id;
}

uploadEventAttendees().then((id) => console.log(`id: ${id}`));
