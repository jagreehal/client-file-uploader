import axios from 'axios';
import mime from 'mime-types';
import * as fs from 'fs/promises';
import * as path from 'path';
import { UploadRequest, UploadTypes } from 'schemas';

export type uploadProps = {
  file: string;
  callbackUrl?: string;
  token?: string;
};

export class Uploader {
  constructor(private readonly uploadURL: string) {
    this.uploadURL = uploadURL;
  }

  public async uploadImage({ file }: uploadProps): Promise<string> {
    const image = await fs.readFile(file);
    const contentType = mime.lookup(file);
    if (!contentType) {
      throw new Error('Could not determine content type');
    }

    const body: UploadRequest = {
      type: UploadTypes.image,
      file: {
        contentType,
        filename: path.basename(file),
      },
    };

    const { data } = await axios.post(`${this.uploadURL}/uploads`, body);

    await axios.put(data.url, {
      body: image,
      headers: {
        'Content-Type': contentType,
      },
    });

    return data.id;
  }

  public async uploadEventAttendeesWithToken(
    props: uploadProps
  ): Promise<string> {
    return this.uploadEventAttendees(props, 'uploads-with-token');
  }

  public async uploadEventAttendees(
    { file, callbackUrl, token }: uploadProps,
    route = 'uploads'
  ): Promise<string> {
    const json = await fs.readFile(file, 'utf-8');
    const contentType = mime.lookup(file);
    if (!contentType) {
      throw new Error('Could not determine content type');
    }

    const body = {
      type: 'event-attendees',
      file: {
        contentType,
        filename: path.basename(file),
      },
      callbackUrl,
    };

    const { data } = await axios.post(`${this.uploadURL}/${route}`, body);
    await axios.put(data.url, {
      body: JSON.stringify(JSON.parse(json)),
      headers: {
        'Content-Type': contentType,
        Authorization: token ? `Bearer ${token}` : undefined,
      },
    });

    return data.id;
  }
}
