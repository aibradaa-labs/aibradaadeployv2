import React from 'react';
import { useSmartphoneStore } from '../../infrastructure/smartphoneStore';
import { useTranslation } from 'react-i18next';
import { 
  Box, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  TextField, 
  Typography, 
  Slider,
  SelectChangeEvent,
  debounce
} from '@mui/material';
import { CustomGrid as Grid } from '../../../shared/components/CustomGrid';
import { PhoneBrand, PhoneSortOption, PhoneOS } from '@features/shared/domain/types';

export const SmartphoneFilters: React.FC = () => {
  const { t } = useTranslation();
  const { 
    selectedBrand,
    selectedType,
    sortOption,
    priceRange,
    searchQuery,
    setBrand,
    setType,
    setSortOption,
    setPriceRange,
    setSearchQuery
  } = useSmartphoneStore();

  // Create a debounced search function
  const debouncedSearch = React.useCallback(
    debounce((value: string) => {
      setSearchQuery(value);
    }, 300),
    [setSearchQuery]
  );

  // Create a debounced price range function
  const debouncedPriceRange = React.useCallback(
    debounce((min?: number, max?: number) => {
      setPriceRange(min, max);
    }, 300),
    [setPriceRange]
  );

  const handleBrandChange = (event: SelectChangeEvent<PhoneBrand>) => {
    setBrand(event.target.value as PhoneBrand);
  };

  const handleOSChange = (event: SelectChangeEvent<PhoneOS>) => {
    setType(event.target.value as PhoneOS);
  };

  const handleSortChange = (event: SelectChangeEvent<PhoneSortOption>) => {
    setSortOption(event.target.value as PhoneSortOption);
  };

  const handlePriceRangeChange = (_event: Event, newValue: number | number[]) => {
    if (Array.isArray(newValue)) {
      debouncedPriceRange(newValue[0], newValue[1]);
    }
  };

  const handleSearchChange = (event: React.ChangeEvent<html lang="en"InputElement>) => {
    debouncedSearch(event.target.value);
  };

  return (
    <Box sx={{ p: 2 }}>
      <Grid container spacing={2}>
        {/* Search */}
        <Grid item xs={12}>
          <TextField
            fullWidth
            label={t('searchPhones')}
            variant="outlined"
            defaultValue={searchQuery}
            onChange={handleSearchChange}
          />
        </Grid>

        {/* Brand Filter */}
        <Grid item xs={12} sm={6} md={3}>
          <FormControl fullWidth>
            <input aria-label="input"Label />{t('brand')}</InputLabel>
            <Select
              value={selectedBrand}
              label={t('brand')}
              onChange={handleBrandChange}
            >
              <MenuItem value="All">{t('allBrands')}</MenuItem>
              <MenuItem value="Samsung">Samsung</MenuItem>
              <MenuItem value="Apple">Apple</MenuItem>
              <MenuItem value="Xiaomi">Xiaomi</MenuItem>
              <MenuItem value="OPPO">OPPO</MenuItem>
              <MenuItem value="vivo">vivo</MenuItem>
              <MenuItem value="HONOR">HONOR</MenuItem>
              <MenuItem value="Other">{t('other')}</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        {/* OS Filter */}
        <Grid item xs={12} sm={6} md={3}>
          <FormControl fullWidth>
            <input aria-label="input"Label />{t('operatingSystem')}</InputLabel>
            <Select
              value={selectedType}
              label={t('operatingSystem')}
              onChange={handleOSChange}
            >
              <MenuItem value="All">{t('allOS')}</MenuItem>
              <MenuItem value="Android">Android</MenuItem>
              <MenuItem value="iOS">iOS</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        {/* Sort Options */}
        <Grid item xs={12} sm={6} md={3}>
          <FormControl fullWidth>
            <input aria-label="input"Label />{t('sortBy')}</InputLabel>
            <Select
              value={sortOption}
              label={t('sortBy')}
              onChange={handleSortChange}
            >
              <MenuItem value="score_desc">{t('bestRated')}</MenuItem>
              <MenuItem value="score_asc">{t('lowestRated')}</MenuItem>
              <MenuItem value="price_desc">{t('highestPrice')}</MenuItem>
              <MenuItem value="price_asc">{t('lowestPrice')}</MenuItem>
              <MenuItem value="name_asc">{t('nameAZ')}</MenuItem>
              <MenuItem value="name_desc">{t('nameZA')}</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        {/* Price Range Slider */}
        <Grid item xs={12}>
          <Typography gutterBottom>
            {t('priceRange')}
          </Typography>
          <Box sx={{ px: 2 }}>
            <Slider
              value={[priceRange.min || 0, priceRange.max || 5000]}
              onChange={handlePriceRangeChange}
              valueLabelDisplay="auto"
              min={0}
              max={5000}
              step={100}
              marks={[
                { value: 0, label: '$0' },
                { value: 1000, label: '$1000' },
                { value: 2000, label: '$2000' },
                { value: 3000, label: '$3000' },
                { value: 4000, label: '$4000' },
                { value: 5000, label: '$5000' },
              ]}
            />
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};