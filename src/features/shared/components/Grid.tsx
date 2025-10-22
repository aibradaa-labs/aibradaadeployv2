import React from 'react';
import { Grid as MuiGrid, GridProps as MuiGridProps } from '@mui/material';

// Create a type for the allowed props
export interface GridProps extends Omit<MuiGridProps, 'component'> {
  children?: React.ReactNode;
}

export const Grid: React.FC<GridProps> = (props) => {
  // Always use div as the component
  return <MuiGrid component="div" {...props} />;
};

export default Grid;