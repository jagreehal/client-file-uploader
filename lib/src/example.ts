import * as path from 'path';
import * as dotenv from 'dotenv'; // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
dotenv.config();

const UPLOAD_URL = process.env.UPLOAD_URL;
if (!UPLOAD_URL) {
  throw new Error('UPLOAD_URL must be defined');
}

import { Uploader } from './index';

const uploader = new Uploader(UPLOAD_URL);

async function run() {
  const fileName = 'hot-air-balloon-g09fb9d553_640.jpg';
  const file = path.join(__dirname, fileName);

  const id = await uploader.uploadImage({
    file,
  });

  return id;
}

run().then((id) => console.log(`id: ${id}`));
