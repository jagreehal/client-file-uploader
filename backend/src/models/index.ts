import { z } from 'zod';

export const PreSignedUrlSchema = z.object({
  id: z.string(),
  title: z.string(),
});

export type PreSignedUrl = z.infer<typeof PreSignedUrlSchema>;

export const UploadTypeEnum = z.enum(['image', 'device']);
type UploadTypeEnum = z.infer<typeof UploadTypeEnum>;

export const UploadSchema = z.object({
  id: z.string(),
  clientId: z.string(),
  type: UploadTypeEnum,
  file: z.object({
    contentType: z.string(),
    filename: z.string(),
  }),
});

export type Upload = z.infer<typeof UploadSchema>;
