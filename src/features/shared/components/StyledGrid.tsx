import { styled } from '@mui/material/styles';
import { Grid as MuiGrid, GridProps } from '@mui/material';

export const StyledGrid = styled(MuiGrid)<GridProps>(() => ({}));

// Pre-configured grid components
export const GridItem = styled(StyledGrid)(({ theme }) => ({
  padding: theme.spacing(1),
}));

export const GridContainer = styled(StyledGrid)(({ theme }) => ({
  padding: theme.spacing(2),
  margin: 0,
  width: '100%',
}));