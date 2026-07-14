import { apiFetch } from '../../auth/auth-client';

export const requestUploadUrl = async (filename: string, contentType: string, fileSize: number) => {
  const data = await apiFetch("/api/upload-url", {
    method: "POST",
    body: JSON.stringify({ filename, contentType, fileSize }),
  });
  return data;
};

export const createJob = async (fileKey: string) => {
  const data = await apiFetch("/api/jobs", {
    method: "POST",
    body: JSON.stringify({ originalUrl: fileKey }),
  });
  return data;
};
