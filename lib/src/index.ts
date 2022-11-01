import axios from 'axios';
import mime from 'mime-types';
import * as fs from 'fs/promises';
import * as path from 'path';

export type uploadImageProps = {
  file: string;
};

export class Uploader {
  constructor(private readonly uploadURL: string) {
    this.uploadURL = uploadURL;
  }

  public async uploadImage({ file }: uploadImageProps) {
    const image = await fs.readFile(file);
    const contentType = mime.lookup(file);
    if (!contentType) {
      throw new Error('Could not determine content type');
    }

    const body = {
      type: 'image',
      file: {
        contentType,
        filename: path.basename(file),
      },
    };

    const { data } = await axios.post(this.uploadURL, body);

    await axios.put(data.url, {
      body: image,
      headers: {
        'Content-Type': contentType,
      },
    });

    return data.id;
  }
}
