import React from 'react';
import { useSmartphoneStore } from '../../infrastructure/smartphoneStore';
import { useTranslation } from 'react-i18next';
import { Card, Typography, Rating, Box, Button } from '@mui/material';
import { CustomGrid as Grid } from '../../../shared/components/CustomGrid';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';
import { useNavigate } from 'react-router-dom';

export const SmartphoneList: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { filteredSmartphones, isLoading, error } = useSmartphoneStore();

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <Typography>{t('loading')}</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  if (!filteredSmartphones.length) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <Typography>{t('noSmartphonesFound')}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3}>
        {filteredSmartphones.map((smartphone) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={smartphone.id}>
          <Card 
            sx={{ 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column',
              '&:hover': {
                transform: 'scale(1.02)',
                transition: 'transform 0.2s ease-in-out'
              }
            }}
          >
            <Box sx={{ position: 'relative', pt: '75%' }}>
              <LazyLoadImage
                src={smartphone.imageUrl}
                alt={smartphone.name}
                effect="blur"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
            </Box>
            <Box sx={{ p: 2, flexGrow: 1 }}>
              <Typography variant="h6" gutterBottom>
                {smartphone.name}
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                {smartphone.brand}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {smartphone.description.slice(0, 100)}...
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Rating value={smartphone.score / 20} precision={0.5} readOnly />
                <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                  {smartphone.score}/100
                </Typography>
              </Box>
              <Typography variant="h6" color="primary">
                ${smartphone.price.toLocaleString()}
              </Typography>
            </Box>
            <Button 
              variant="contained" 
              color="primary"
              fullWidth
              onClick={() => navigate(`/smartphones/${smartphone.id}`)}
              sx={{ mt: 'auto', mx: 2, mb: 2 }}
            >
              {t('viewDetails')}
            </Button>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};