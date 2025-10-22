import { Grid, GridProps } from '@mui/material';
import { ElementType } from 'react';

import { Theme, SxProps } from '@mui/material/styles';
import { GridSize } from '@mui/material';

export interface CustomGridProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'color'> {
  children?: React.ReactNode;
  component?: ElementType;
  item?: boolean;
  container?: boolean;
  spacing?: number | string;
  xs?: GridSize;
  sm?: GridSize;
  md?: GridSize;
  lg?: GridSize;
  sx?: SxProps<Theme>;
}

export const CustomGrid: React.FC<CustomGridProps> = ({ children, component = "div", ...props }) => {
  return <Grid component={component} {...props}>{children}</Grid>;
};