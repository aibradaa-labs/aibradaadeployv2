import { Chip, Slider, TextField, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { Box } from '@mui/system';
import { useState } from 'react';

export interface LaptopFilters {
  priceRange: [number, number];
  brands: string[];
  processorTypes: string[];
  ramSizes: string[];
  searchQuery: string;
}

interface LaptopFiltersProps {
  availableBrands: string[];
  availableProcessors: string[];
  availableRamSizes: string[];
  maxPrice: number;
  minPrice: number;
  onFiltersChange: (filters: LaptopFilters) => void;
}

export const LaptopFilters: React.FC<LaptopFiltersProps> = ({
  availableBrands,
  availableProcessors,
  availableRamSizes,
  maxPrice,
  minPrice,
  onFiltersChange,
}) => {
  const [filters, setFilters] = useState<LaptopFilters>({
    priceRange: [minPrice, maxPrice],
    brands: [],
    processorTypes: [],
    ramSizes: [],
    searchQuery: '',
  });

  const handlePriceChange = (_event: Event, newValue: number | number[]) => {
    const newPriceRange = newValue as [number, number];
    const newFilters = { ...filters, priceRange: newPriceRange };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleChipSelect = (type: 'brands' | 'processorTypes' | 'ramSizes', value: string) => {
    const currentValues = filters[type];
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];
    
    const newFilters = { ...filters, [type]: newValues };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newFilters = { ...filters, searchQuery: event.target.value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  return (
    <Box sx={{ p: 2 }}>
      <TextField
        fullWidth
        label="Search laptops"
        variant="outlined"
        value={filters.searchQuery}
        onChange={handleSearchChange}
        sx={{ mb: 3 }}
      />

      <Box sx={{ mb: 3 }}>
        <input aria-label="input"Label />Price Range</InputLabel>
        <Slider
          value={filters.priceRange}
          onChange={handlePriceChange}
          valueLabelDisplay="auto"
          min={minPrice}
          max={maxPrice}
          step={100}
        />
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>${filters.priceRange[0]}</span>
          <span>${filters.priceRange[1]}</span>
        </Box>
      </Box>

      <Box sx={{ mb: 2 }}>
        <input aria-label="input"Label />Brands</InputLabel>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
          {availableBrands.map(brand => (
            <Chip
              key={brand}
              label={brand}
              onClick={() => handleChipSelect('brands', brand)}
              color={filters.brands.includes(brand) ? 'primary' : 'default'}
            />
          ))}
        </Box>
      </Box>

      <Box sx={{ mb: 2 }}>
        <input aria-label="input"Label />Processor Types</InputLabel>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
          {availableProcessors.map(processor => (
            <Chip
              key={processor}
              label={processor}
              onClick={() => handleChipSelect('processorTypes', processor)}
              color={filters.processorTypes.includes(processor) ? 'primary' : 'default'}
            />
          ))}
        </Box>
      </Box>

      <Box>
        <input aria-label="input"Label />RAM Sizes</InputLabel>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
          {availableRamSizes.map(ram => (
            <Chip
              key={ram}
              label={ram}
              onClick={() => handleChipSelect('ramSizes', ram)}
              color={filters.ramSizes.includes(ram) ? 'primary' : 'default'}
            />
          ))}
        </Box>
      </Box>
    </Box>
  );
};