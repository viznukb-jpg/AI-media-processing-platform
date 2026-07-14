import { Job, JobEvent } from "@prisma/client";

export interface JobDetailsResponse extends Job {
  events: JobEvent[];
  signedProcessedUrl: string | null;
}
