import { useMemo } from 'react';
import { LaptopFilters } from '../components/LaptopFilters';
import { Laptop } from '../types/laptops';

export const useFilteredLaptops = (laptops: Laptop[], filters: LaptopFilters) => {
  return useMemo(() => {
    return laptops.filter(laptop => {
      // Price range filter
      const price = laptop.price;
      if (price < filters.priceRange[0] || price > filters.priceRange[1]) {
        return false;
      }

      // Brand filter
      if (filters.brands.length > 0 && !filters.brands.includes(laptop.brand)) {
        return false;
      }

      // Processor filter
      if (filters.processorTypes.length > 0 && !filters.processorTypes.some(p => laptop.processor.includes(p))) {
        return false;
      }

      // RAM filter
      if (filters.ramSizes.length > 0 && !filters.ramSizes.includes(laptop.ram)) {
        return false;
      }

      // Search query filter
      if (filters.searchQuery) {
        const searchLower = filters.searchQuery.toLowerCase();
        const searchableText = `${laptop.brand} ${laptop.model} ${laptop.processor} ${laptop.ram} ${laptop.storage}`.toLowerCase();
        if (!searchableText.includes(searchLower)) {
          return false;
        }
      }

      return true;
    });
  }, [laptops, filters]);
};

export const useAvailableFilters = (laptops: Laptop[]) => {
  return useMemo(() => {
    const brands = new Set<string>();
    const processors = new Set<string>();
    const ramSizes = new Set<string>();
    let minPrice = Infinity;
    let maxPrice = -Infinity;

    laptops.forEach(laptop => {
      brands.add(laptop.brand);
      processors.add(laptop.processor.split(' ')[0]); // Get processor family (e.g., "Intel" or "AMD")
      ramSizes.add(laptop.ram);
      minPrice = Math.min(minPrice, laptop.price);
      maxPrice = Math.max(maxPrice, laptop.price);
    });

    return {
      availableBrands: Array.from(brands).sort(),
      availableProcessors: Array.from(processors).sort(),
      availableRamSizes: Array.from(ramSizes).sort((a, b) => {
        const aNum = parseInt(a);
        const bNum = parseInt(b);
        return aNum - bNum;
      }),
      minPrice: Math.floor(minPrice),
      maxPrice: Math.ceil(maxPrice),
    };
  }, [laptops]);
};