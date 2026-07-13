import { apiFetch } from '../../auth/auth-client';
import { Job } from '../types';

export const fetchJobs = async (): Promise<Job[]> => {
  const data = await apiFetch("/api/jobs");
  return data?.jobs || [];
};

export const fetchJobDetails = async (id: string): Promise<Job> => {
  const data = await apiFetch(`/api/jobs/${id}`);
  return data?.job;
};

// If deleteJob is ever needed
export const deleteJob = async (id: string): Promise<void> => {
  await apiFetch(`/api/jobs/${id}`, {
    method: "DELETE",
  });
};
