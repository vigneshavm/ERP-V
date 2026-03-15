import { logger } from '@/shared/lib/logger';
import React, { Component, ErrorInfo, ReactNode } from 'react';
import * as Sentry from '@sentry/react';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode | ((props: { error: Error; resetError: () => void }) => ReactNode);
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Reusable ErrorBoundary component for trapping React rendering errors.
 * Integrates with Sentry for automatic error reporting.
 */
class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Report error to Sentry
    Sentry.captureException(error, { extra: { errorInfo } });
    
    // Optional callback
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
    
    // Log for local development
    logger.error('ErrorBoundary caught an error:', { error, errorInfo });
  }

  public resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        if (typeof this.props.fallback === 'function') {
          return this.props.fallback({ 
            error: this.state.error, 
            resetError: this.resetError 
          });
        }
        return this.props.fallback;
      }

      // Default minimal fallback if none provided
      return (
        <div className="p-6 bg-red-50 text-red-900 border border-red-200 rounded-lg">
          <h2 className="text-lg font-bold">Something went wrong</h2>
          <p className="mt-2 text-sm opacity-80">{this.state.error.message}</p>
          <button
            onClick={this.resetError}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
