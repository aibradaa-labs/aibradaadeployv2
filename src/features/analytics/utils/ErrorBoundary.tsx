import { Component, ComponentType, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  onError: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.props.onError(error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return null;
    }

    return this.props.children;
  }
}