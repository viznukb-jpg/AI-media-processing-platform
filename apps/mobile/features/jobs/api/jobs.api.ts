import { apiFetch } from '../../auth/auth-client';
import { Job, JobDetailsResponse } from '../types';

export const fetchJobs = async (skip: number = 0, take: number = 20): Promise<Job[]> => {
  const data = await apiFetch(`/api/jobs?skip=${skip}&take=${take}`);
  return data?.jobs || [];
};

export const fetchJobDetails = async (id: string): Promise<JobDetailsResponse> => {
  const data = await apiFetch(`/api/jobs/${id}`);
  return data?.job;
};

// If deleteJob is ever needed
export const deleteJob = async (id: string): Promise<void> => {
  await apiFetch(`/api/jobs/${id}`, {
    method: "DELETE",
  });
};
