import { useQuery } from '@tanstack/react-query';
import { fetchJobs } from '../api/jobs.api';

export const useJobsQuery = () => {
  return useQuery({
    queryKey: ['jobs'],
    queryFn: fetchJobs,
  });
};
