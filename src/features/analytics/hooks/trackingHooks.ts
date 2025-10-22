import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { logPageView, logError } from '../services/analytics';

export const usePageTracking = () => {
  const location = useLocation();

  useEffect(() => {
    logPageView(location.pathname + location.search);
  }, [location]);
};

export const useErrorTracking = (error: Error | null, componentStack?: string) => {
  useEffect(() => {
    if (error) {
      logError(error, componentStack);
    }
  }, [error, componentStack]);
};