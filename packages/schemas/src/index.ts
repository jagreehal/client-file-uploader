import { z } from 'zod';

export const EventAttendees = z.object({
  eventId: z.string(),
  attendees: z.string().array(),
});
export type EventAttendees = z.infer<typeof EventAttendees>;

export enum UploadTypes {
  image = 'image',
  device = 'device',
  'event-attendees' = 'event-attendees',
}

export const EventAttendeesParsingResponse = z.object({
  success: z.boolean(),
  error: z.string().optional(),
});
export type EventAttendeesParsingResponse = z.infer<
  typeof EventAttendeesParsingResponse
>;

export const UploadTypeEnum = z.nativeEnum(UploadTypes);
export type UploadTypeEnum = z.infer<typeof UploadTypeEnum>;

export const UploadRequest = z.object({
  type: UploadTypeEnum,
  callbackUrl: z.string().url().optional(),
  file: z.object({
    contentType: z.string(),
    filename: z.string(),
  }),
});

export type UploadRequest = z.infer<typeof UploadRequest>;

export type UploadResponse = {
  contentType: string;
  id: string;
  url: string;
};
