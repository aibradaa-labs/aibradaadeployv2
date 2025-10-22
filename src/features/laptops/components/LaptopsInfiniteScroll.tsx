import { Box, CircularProgress } from '@mui/material';
import { Grid } from '../../../shared/components/Grid';
import { useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import { useLaptopsInfiniteQuery } from '../services/laptopsHooks';
import LaptopCard from './LaptopCard';

interface LaptopsInfiniteScrollProps {
  laptops: Laptop[];
}

export const LaptopsInfiniteScroll: React.FC<LaptopsInfiniteScrollProps> = ({ laptops }) => {
  const { ref, inView } = useInView();
  const { fetchNextPage, hasNextPage, isLoading, isFetchingNextPage } = useLaptopsInfiniteQuery();

  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, fetchNextPage, hasNextPage]);

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Grid container spacing={3}>
        {laptops.map((laptop) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={laptop.id}>
            <LaptopCard laptop={laptop} />
          </Grid>
        ))}
      </Grid>
      <Box ref={ref} display="flex" justifyContent="center" p={4}>
        {isFetchingNextPage && <CircularProgress />}
      </Box>
    </Box>
  );
};