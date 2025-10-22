import { useInfiniteQuery } from '@tanstack/react-query';
import { laptopKeys } from '../../shared/services/queryClient';
import { fetchLaptops } from './laptopsApi';
import { Laptop } from '../types/laptops';

const PAGE_SIZE = 10;

export const useLaptopsInfiniteQuery = () => {
  return useInfiniteQuery<Laptop[]>({
    queryKey: laptopKeys.lists(),
    queryFn: ({ pageParam = 1 }) => fetchLaptops({ page: pageParam, pageSize: PAGE_SIZE }),
    getNextPageParam: (lastPage, allPages) => {
      const nextPage = allPages.length + 1;
      return lastPage.length === PAGE_SIZE ? nextPage : undefined;
    },
    initialPageParam: 1,
  });
};