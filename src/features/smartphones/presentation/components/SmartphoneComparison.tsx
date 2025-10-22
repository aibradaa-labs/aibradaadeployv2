import React from 'react';
import { useSmartphoneStore } from '../../infrastructure/smartphoneStore';
import { SmartphoneDomainService } from '../../domain/smartphoneDomainService';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Paper,
  Typography,
  Divider,
  Rating,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Chip
} from '@mui/material';
import { Grid } from '../../../shared/components/Grid';
import {
  TrendingUp as WinnerIcon,
  Memory as CPUIcon,
  Storage as StorageIcon,
  Memory as RAMIcon,
  PhotoCamera as CameraIcon,
  BatteryChargingFull as BatteryIcon,
  AttachMoney as PriceIcon
} from '@mui/icons-material';

interface ComparisonRowProps {
  category: string;
  phone1Value: React.ReactNode;
  phone2Value: React.ReactNode;
  winner: number; // 1 for phone1, 2 for phone2, 0 for tie
}

const ComparisonRow: React.FC<ComparisonRowProps> = ({ 
  category, 
  phone1Value, 
  phone2Value, 
  winner 
}) => {
  const backgroundColor = React.useMemo(() => {
    switch (winner) {
      case 1: return 'rgba(76, 175, 80, 0.1)'; // Green tint for winner
      case 2: return 'rgba(76, 175, 80, 0.1)'; // Green tint for winner
      default: return 'transparent';
    }
  }, [winner]);

  return (
    <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
      <TableCell component="th" scope="row">
        <Typography variant="subtitle2">{category}</Typography>
      </TableCell>
      <TableCell align="center" sx={{ backgroundColor: winner === 1 ? backgroundColor : 'transparent' }}>
        <Box display="flex" alignItems="center" justifyContent="center">
          {phone1Value}
          {winner === 1 && <WinnerIcon color="success" sx={{ ml: 1 }} />}
        </Box>
      </TableCell>
      <TableCell align="center" sx={{ backgroundColor: winner === 2 ? backgroundColor : 'transparent' }}>
        <Box display="flex" alignItems="center" justifyContent="center">
          {phone2Value}
          {winner === 2 && <WinnerIcon color="success" sx={{ ml: 1 }} />}
        </Box>
      </TableCell>
    </TableRow>
  );
};

interface SmartphoneComparisonProps {
  phone1Id: string;
  phone2Id: string;
}

export const SmartphoneComparison: React.FC<SmartphoneComparisonProps> = ({ 
  phone1Id, 
  phone2Id 
}) => {
  const { t } = useTranslation();
  const { 
    selectedSmartphone: phone1,
    fetchSmartphoneById,
    smartphones 
  } = useSmartphoneStore();

  const phone2 = React.useMemo(() => 
    smartphones.find(p => p.id === phone2Id), 
    [smartphones, phone2Id]
  );

  const domainService = React.useMemo(() => new SmartphoneDomainService(), []);

  React.useEffect(() => {
    fetchSmartphoneById(phone1Id);
  }, [phone1Id, fetchSmartphoneById]);

  if (!phone1 || !phone2) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <Typography>{t('loading')}</Typography>
      </Box>
    );
  }

  const comparison = domainService.compareSmartphones(phone1, phone2);

  return (
    <Paper elevation={3} sx={{ p: 3, my: 3 }}>
      <Typography variant="h4" gutterBottom align="center">
        {t('smartphoneComparison')}
      </Typography>

      {/* Comparison Table */}
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>{t('feature')}</TableCell>
            <TableCell align="center">
              <Box>
                <Typography variant="subtitle1">{phone1.name}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {phone1.brand}
                </Typography>
              </Box>
            </TableCell>
            <TableCell align="center">
              <Box>
                <Typography variant="subtitle1">{phone2.name}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {phone2.brand}
                </Typography>
              </Box>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {/* Price */}
          <ComparisonRow
            category={t('price')}
            phone1Value={
              <Box display="flex" alignItems="center" justifyContent="center">
                <PriceIcon sx={{ mr: 1 }} />
                <Typography>${phone1.price.toLocaleString()}</Typography>
              </Box>
            }
            phone2Value={
              <Box display="flex" alignItems="center" justifyContent="center">
                <PriceIcon sx={{ mr: 1 }} />
                <Typography>${phone2.price.toLocaleString()}</Typography>
              </Box>
            }
            winner={phone1.price < phone2.price ? 1 : phone1.price > phone2.price ? 2 : 0}
          />

          {/* CPU */}
          <ComparisonRow
            category={t('processor')}
            phone1Value={
              <Box display="flex" alignItems="center" justifyContent="center">
                <CPUIcon sx={{ mr: 1 }} />
                <Typography>{phone1.features.cpu}</Typography>
              </Box>
            }
            phone2Value={
              <Box display="flex" alignItems="center" justifyContent="center">
                <CPUIcon sx={{ mr: 1 }} />
                <Typography>{phone2.features.cpu}</Typography>
              </Box>
            }
            winner={
              domainService.calculateCpuScore(phone1.features.cpu) > 
              domainService.calculateCpuScore(phone2.features.cpu) ? 1 : 
              domainService.calculateCpuScore(phone1.features.cpu) < 
              domainService.calculateCpuScore(phone2.features.cpu) ? 2 : 0
            }
          />

          {/* RAM */}
          <ComparisonRow
            category={t('ram')}
            phone1Value={
              <Box display="flex" alignItems="center" justifyContent="center">
                <RAMIcon sx={{ mr: 1 }} />
                <Typography>{phone1.features.ram}</Typography>
              </Box>
            }
            phone2Value={
              <Box display="flex" alignItems="center" justifyContent="center">
                <RAMIcon sx={{ mr: 1 }} />
                <Typography>{phone2.features.ram}</Typography>
              </Box>
            }
            winner={
              parseInt(phone1.features.ram) > parseInt(phone2.features.ram) ? 1 :
              parseInt(phone1.features.ram) < parseInt(phone2.features.ram) ? 2 : 0
            }
          />

          {/* Storage */}
          <ComparisonRow
            category={t('storage')}
            phone1Value={
              <Box display="flex" alignItems="center" justifyContent="center">
                <StorageIcon sx={{ mr: 1 }} />
                <Typography>{phone1.features.storage}</Typography>
              </Box>
            }
            phone2Value={
              <Box display="flex" alignItems="center" justifyContent="center">
                <StorageIcon sx={{ mr: 1 }} />
                <Typography>{phone2.features.storage}</Typography>
              </Box>
            }
            winner={
              parseInt(phone1.features.storage) > parseInt(phone2.features.storage) ? 1 :
              parseInt(phone1.features.storage) < parseInt(phone2.features.storage) ? 2 : 0
            }
          />

          {/* Camera */}
          <ComparisonRow
            category={t('camera')}
            phone1Value={
              <Box display="flex" flexDirection="column" alignItems="center">
                <Box display="flex" alignItems="center">
                  <CameraIcon sx={{ mr: 1 }} />
                  <Typography>{phone1.features.camera.main}MP</Typography>
                </Box>
                {phone1.features.camera.ultrawide && (
                  <Typography variant="caption" color="text.secondary">
                    {t('ultrawide')}: {phone1.features.camera.ultrawide}MP
                  </Typography>
                )}
                {phone1.features.camera.telephoto && (
                  <Typography variant="caption" color="text.secondary">
                    {t('telephoto')}: {phone1.features.camera.telephoto}MP
                  </Typography>
                )}
              </Box>
            }
            phone2Value={
              <Box display="flex" flexDirection="column" alignItems="center">
                <Box display="flex" alignItems="center">
                  <CameraIcon sx={{ mr: 1 }} />
                  <Typography>{phone2.features.camera.main}MP</Typography>
                </Box>
                {phone2.features.camera.ultrawide && (
                  <Typography variant="caption" color="text.secondary">
                    {t('ultrawide')}: {phone2.features.camera.ultrawide}MP
                  </Typography>
                )}
                {phone2.features.camera.telephoto && (
                  <Typography variant="caption" color="text.secondary">
                    {t('telephoto')}: {phone2.features.camera.telephoto}MP
                  </Typography>
                )}
              </Box>
            }
            winner={
              parseInt(phone1.features.camera.main) > parseInt(phone2.features.camera.main) ? 1 :
              parseInt(phone1.features.camera.main) < parseInt(phone2.features.camera.main) ? 2 : 0
            }
          />

          {/* Battery */}
          <ComparisonRow
            category={t('battery')}
            phone1Value={
              <Box display="flex" alignItems="center" justifyContent="center">
                <BatteryIcon sx={{ mr: 1 }} />
                <Typography>{phone1.features.battery}</Typography>
              </Box>
            }
            phone2Value={
              <Box display="flex" alignItems="center" justifyContent="center">
                <BatteryIcon sx={{ mr: 1 }} />
                <Typography>{phone2.features.battery}</Typography>
              </Box>
            }
            winner={
              parseInt(phone1.features.battery) > parseInt(phone2.features.battery) ? 1 :
              parseInt(phone1.features.battery) < parseInt(phone2.features.battery) ? 2 : 0
            }
          />

          {/* Overall Score */}
          <ComparisonRow
            category={t('overallScore')}
            phone1Value={
              <Box display="flex" alignItems="center" justifyContent="center">
                <Rating value={phone1.score / 20} precision={0.5} readOnly />
                <Typography sx={{ ml: 1 }}>{phone1.score}/100</Typography>
              </Box>
            }
            phone2Value={
              <Box display="flex" alignItems="center" justifyContent="center">
                <Rating value={phone2.score / 20} precision={0.5} readOnly />
                <Typography sx={{ ml: 1 }}>{phone2.score}/100</Typography>
              </Box>
            }
            winner={phone1.score > phone2.score ? 1 : phone1.score < phone2.score ? 2 : 0}
          />
        </TableBody>
      </Table>

      {/* Winner Section */}
      <Box mt={4} textAlign="center">
        <Typography variant="h5" gutterBottom>
          {t('winner')}
        </Typography>
        <Typography variant="h4" color="primary">
          {comparison.winner.name}
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          {t('winnerExplanation')}
        </Typography>
      </Box>

      {/* Features Comparison */}
      <Box mt={4}>
        <Typography variant="h6" gutterBottom>
          {t('uniqueFeatures')}
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom>
              {phone1.name}
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={1}>
              {phone1.features.features.map((feature, index) => (
                <Chip key={index} label={feature} />
              ))}
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom>
              {phone2.name}
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={1}>
              {phone2.features.features.map((feature, index) => (
                <Chip key={index} label={feature} />
              ))}
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
};