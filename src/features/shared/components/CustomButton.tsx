import { Button, ButtonProps } from '@mui/material';
import { ElementType } from 'react';

export interface CustomButtonProps extends ButtonProps {
  component?: ElementType;
}

export const CustomButton: React.FC<CustomButtonProps> = (props) => {
  return <Button {...props} />;
};