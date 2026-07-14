import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchJobs } from '../api/jobs.api';

export const useJobsQuery = () => {
  return useInfiniteQuery({
    queryKey: ['jobs'],
    queryFn: ({ pageParam = 0 }) => fetchJobs(pageParam as number, 20),
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < 20) return undefined;
      return allPages.length * 20;
    },
    initialPageParam: 0,
  });
};
