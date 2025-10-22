import { Box } from '@mui/material';
import { useState } from 'react';
import { LaptopFilters } from './LaptopFilters';
import { LaptopsInfiniteScroll } from './LaptopsInfiniteScroll';
import { useFilteredLaptops, useAvailableFilters } from '../utils/filterHooks';
import { useLaptopsInfiniteQuery } from '../services/laptopsHooks';

export const LaptopsView: React.FC = () => {
  const { data } = useLaptopsInfiniteQuery();
  const allLaptops = data ? data.pages.flatMap(page => page) : [];
  
  const { availableBrands, availableProcessors, availableRamSizes, minPrice, maxPrice } = useAvailableFilters(allLaptops);
  const [currentFilters, setCurrentFilters] = useState<LaptopFilters>({
    priceRange: [minPrice, maxPrice],
    brands: [],
    processorTypes: [],
    ramSizes: [],
    searchQuery: '',
  });

  const filteredLaptops = useFilteredLaptops(allLaptops, currentFilters);

  return (
    <Box sx={{ display: 'flex' }}>
      <Box sx={{ width: 300, flexShrink: 0 }}>
        <LaptopFilters
          availableBrands={availableBrands}
          availableProcessors={availableProcessors}
          availableRamSizes={availableRamSizes}
          maxPrice={maxPrice}
          minPrice={minPrice}
          onFiltersChange={setCurrentFilters}
        />
      </Box>
      <Box sx={{ flexGrow: 1 }}>
        <LaptopsInfiniteScroll laptops={filteredLaptops} />
      </Box>
    </Box>
  );
};