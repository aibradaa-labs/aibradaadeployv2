import { Card, CardContent, CardMedia, Typography, Box, Rating } from '@mui/material';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';
import { Laptop } from '@features/shared/domain/types';

interface LaptopCardProps {
  laptop: Laptop;
}

const LaptopCard: React.FC<LaptopCardProps> = ({ laptop }) => {
  return (
    <Card elevation={2}>
      <Box sx={{ position: 'relative', paddingTop: '56.25%' }}>
        <LazyLoadImage
          alt={`${laptop.brand} ${laptop.model}`}
          src={laptop.imageUrl}
          effect="blur"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      </Box>
      <CardContent>
        <Typography gutterBottom variant="h6" component="div">
          {laptop.brand} {laptop.model}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {laptop.specs.cpu} | {laptop.specs.ram} RAM
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {laptop.specs.storage} | {laptop.specs.display}
        </Typography>
        <Box display="flex" alignItems="center" mt={1}>
          <Rating value={laptop.score} precision={0.5} readOnly size="small" />
          <Typography variant="body2" color="text.secondary" ml={1}>
            ({laptop.scores.value})
          </Typography>
        </Box>
        <Typography variant="h6" color="primary" mt={1}>
          ${laptop.price.toLocaleString()}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default LaptopCard;