import { useQuery } from '@tanstack/react-query';
import { fetchJobDetails } from '../api/jobs.api';

export const useJobQuery = (id: string) => {
  return useQuery({
    queryKey: ['job', id],
    queryFn: () => fetchJobDetails(id),
    refetchInterval: (query) => {
      const currentStatus = query.state?.data?.status;
      if (currentStatus === 'completed' || currentStatus === 'failed') {
        return false; // Stop polling
      }
      return 2000; // Poll every 2s
    },
  });
};
