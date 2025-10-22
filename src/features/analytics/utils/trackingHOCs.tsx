import { ComponentType, useEffect, useState } from 'react';
import { ErrorBoundary } from './ErrorBoundary';
import { logPageView, logError } from '../services/analytics';

export function withPageTracking<P extends object>(
  WrappedComponent: ComponentType<P>,
  pagePath: string
) {
  return function WithPageTracking(props: P) {
    useEffect(() => {
      logPageView(pagePath);
    }, []);

    return <WrappedComponent {...props} />;
  };
}

export function withErrorTracking<P extends object>(
  WrappedComponent: ComponentType<P>
) {
  return function WithErrorBoundary(props: P) {
    const [error, setError] = useState<Error | null>(null);
    const [errorInfo, setErrorInfo] = useState<React.ErrorInfo | null>(null);

    useEffect(() => {
      if (error && errorInfo?.componentStack) {
        logError(error, errorInfo.componentStack);
      } else if (error) {
        logError(error);
      }
    }, [error, errorInfo]);

    if (error) {
      return <ErrorFallback error={error} />;
    }

    return (
      <ErrorBoundary
        onError={(error, errorInfo) => {
          setError(error);
          setErrorInfo(errorInfo);
        }}
      >
        <WrappedComponent {...props} />
      </ErrorBoundary>
    );
  };
}

const ErrorFallback: React.FC<{ error: Error }> = ({ error }) => (
  <div>
    <h1>Something went wrong</h1>
    <pre>{error.message}</pre>
  </div>
);