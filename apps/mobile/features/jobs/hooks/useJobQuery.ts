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
      
      if (query.state?.error) {
        const failureCount = query.state.fetchFailureCount || 1;
        return Math.min(1000 * 2 ** failureCount, 30000);
      }
      
      return 2000; // Poll every 2s
    },
  });
};
