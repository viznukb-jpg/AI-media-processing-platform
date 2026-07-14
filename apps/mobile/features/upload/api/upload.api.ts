import { apiFetch } from "../../auth/auth-client";
import { Job } from "../../jobs/types";

export const requestUploadUrl = async (
  filename: string,
  contentType: string,
  fileSize: number,
): Promise<{
  uploadUrl: string;
  key: string;
  fields: Record<string, string>;
}> => {
  const data = await apiFetch<{
    uploadUrl: string;
    key: string;
    fields: Record<string, string>;
  }>("/api/upload-url", {
    method: "POST",
    body: JSON.stringify({ filename, contentType, fileSize }),
  });
  return data;
};

export const createJob = async (fileKey: string): Promise<{ job: Job }> => {
  const data = await apiFetch<{ job: Job }>("/api/jobs", {
    method: "POST",
    body: JSON.stringify({ originalUrl: fileKey }),
  });
  return data;
};
