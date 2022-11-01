import { z } from 'zod';
import { UploadTypeEnum } from 'schemas';
export const PreSignedUrlSchema = z.object({
  id: z.string(),
  title: z.string(),
});

export type PreSignedUrl = z.infer<typeof PreSignedUrlSchema>;

export const UploadSchema = z.object({
  id: z.string(),
  clientId: z.string(),
  type: UploadTypeEnum,
  file: z.object({
    contentType: z.string(),
    filename: z.string(),
  }),
  callbackURL: z.string().optional(),
});

export type Upload = z.infer<typeof UploadSchema>;

export type ObjectCreatedEventS3 = {
  version: string;
  bucket: {
    name: string;
  };
  object: {
    key: string;
    size: number;
    etag: string;
    sequencer: string;
  };
  'request-id': string;
  requester: string;
  'source-ip-address': string;
  reason: string;
};
