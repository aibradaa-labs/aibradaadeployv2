import React from 'react';
import { useSmartphoneStore } from '../../infrastructure/smartphoneStore';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { 
  Container, 
  Typography, 
  Paper, 
  Box, 
  Rating, 
  Divider, 
  Table, 
  TableBody, 
  TableCell, 
  TableRow,
  Chip,
  Button
} from '@mui/material';
import { Grid } from '../../../shared/components/Grid';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';

export const SmartphoneDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const { selectedSmartphone, isLoading, error, fetchSmartphoneById } = useSmartphoneStore();

  React.useEffect(() => {
    if (id) {
      fetchSmartphoneById(id);
    }
  }, [id, fetchSmartphoneById]);

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

  if (!selectedSmartphone) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <Typography>{t('smartphoneNotFound')}</Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Grid container spacing={4}>
        {/* Image Section */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Box sx={{ position: 'relative', pt: '100%' }}>
              <LazyLoadImage
                src={selectedSmartphone.imageUrl}
                alt={selectedSmartphone.name}
                effect="blur"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain'
                }}
              />
            </Box>
          </Paper>
        </Grid>

        {/* Details Section */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
              {selectedSmartphone.name}
            </Typography>
            
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {selectedSmartphone.brand}
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Rating value={selectedSmartphone.score / 20} precision={0.5} readOnly />
              <Typography variant="body1" sx={{ ml: 1 }}>
                {selectedSmartphone.score}/100
              </Typography>
            </Box>

            <Typography variant="h5" color="primary" gutterBottom>
              ${selectedSmartphone.price.toLocaleString()}
            </Typography>

            <Typography variant="body1" paragraph>
              {selectedSmartphone.description}
            </Typography>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" gutterBottom>
              {t('specifications')}
            </Typography>

            <Table>
              <TableBody>
                {selectedSmartphone.features?.cpu && (
                  <TableRow>
                    <TableCell component="th" scope="row">CPU</TableCell>
                    <TableCell>{selectedSmartphone.features.cpu}</TableCell>
                  </TableRow>
                )}
                
                {selectedSmartphone.features?.ram && (
                  <TableRow>
                    <TableCell component="th" scope="row">RAM</TableCell>
                    <TableCell>{selectedSmartphone.features.ram}GB</TableCell>
                  </TableRow>
                )}
                
                {selectedSmartphone.features?.storage && (
                  <TableRow>
                    <TableCell component="th" scope="row">{t('storage')}</TableCell>
                    <TableCell>{selectedSmartphone.features.storage}GB</TableCell>
                  </TableRow>
                )}
                
                {selectedSmartphone.features?.camera && (
                  <TableRow>
                    <TableCell component="th" scope="row">{t('camera')}</TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {t('main')}: {selectedSmartphone.features.camera.main}MP
                      </Typography>
                      {selectedSmartphone.features.camera.ultrawide && (
                        <Typography variant="body2">
                          {t('ultrawide')}: {selectedSmartphone.features.camera.ultrawide}MP
                        </Typography>
                      )}
                      {selectedSmartphone.features.camera.telephoto && (
                        <Typography variant="body2">
                          {t('telephoto')}: {selectedSmartphone.features.camera.telephoto}MP
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                )}
                
                {selectedSmartphone.features?.battery && (
                  <TableRow>
                    <TableCell component="th" scope="row">{t('battery')}</TableCell>
                    <TableCell>{selectedSmartphone.features.battery}mAh</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            <Box sx={{ mt: 3 }}>
              {selectedSmartphone.features?.features?.map((feature, index) => (
                <Chip
                  key={index}
                  label={feature}
                  sx={{ m: 0.5 }}
                  variant="outlined"
                />
              ))}
            </Box>

            <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
              <Button 
                variant="contained" 
                color="primary"
                fullWidth
                href={selectedSmartphone.shopee_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {t('buyNow')}
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};