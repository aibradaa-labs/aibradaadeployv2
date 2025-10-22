import React, { ReactNode, useEffect } from 'react';
import ReactGA from 'react-ga4';

interface AnalyticsProviderProps {
  children: ReactNode;
}

export const AnalyticsProvider: React.FC<AnalyticsProviderProps> = ({ children }) => {
  useEffect(() => {
    ReactGA.initialize('G-XXXXXXXXXX'); // Replace with your GA4 measurement ID
  }, []);

  return <>{children}</>;
};

export const logEvent = (
  category: string,
  action: string,
  label?: string,
  value?: number
): void => {
  ReactGA.event({
    category,
    action,
    label,
    value,
  });
};

export const logPageView = (path: string): void => {
  ReactGA.send({ hitType: 'pageview', page: path });
};

export const logError = (error: Error, componentStack?: string): void => {
  ReactGA.event({
    category: 'Error',
    action: error.name,
    label: `${error.message}${componentStack ? `\n${componentStack}` : ''}`,
  });
};