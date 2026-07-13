export type JobStatus = 
  | "queued" 
  | "downloading" 
  | "analyzing" 
  | "generating_thumbnail" 
  | "completed" 
  | "failed";

export type JobEvent = {
  id: string;
  status: JobStatus;
  message: string | null;
  timestamp: string;
};

export type Job = {
  id: string;
  status: JobStatus;
  progress: number;
  originalUrl: string;
  processedUrl: string | null;
  events?: JobEvent[]; // optional because home doesn't fetch it
  createdAt: string;
};
