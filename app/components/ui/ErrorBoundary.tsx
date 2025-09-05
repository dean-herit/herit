"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { Card, CardBody, Button } from "@heroui/react";
import { AlertCircle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);

    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card className="max-w-md mx-auto mt-8" data-testid="error-boundary">
          <CardBody className="text-center space-y-4 p-6">
            <AlertCircle className="h-12 w-12 text-danger mx-auto" />
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                Something went wrong
              </h3>
              <p className="text-sm text-default-600 mt-2">
                We encountered an unexpected error. Please try refreshing the
                page.
              </p>
            </div>

            {process.env.NODE_ENV === "development" && this.state.error && (
              <div className="text-left bg-danger-50 p-3 rounded-lg">
                <p className="text-xs font-mono text-danger-600">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <Button
              color="primary"
              data-testid="button"
              startContent={<RefreshCw className="h-4 w-4" />}
              variant="solid"
              onClick={this.handleRetry}
            >
              Try Again
            </Button>
          </CardBody>
        </Card>
      );
    }

    return <div data-testid="error-boundary">{this.props.children}</div>;
  }
}

// Query-specific error boundary for TanStack Query errors
interface QueryErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, retry: () => void) => ReactNode;
}

export function QueryErrorBoundary({
  children,
  fallback,
}: QueryErrorBoundaryProps) {
  return (
    <ErrorBoundary
      fallback={fallback ? undefined : <DefaultQueryErrorFallback />}
      onError={(error) => {
        // Log query errors specifically
        console.error("Query error:", error);
      }}
    >
      {children}
    </ErrorBoundary>
  );
}

function DefaultQueryErrorFallback() {
  return (
    <Card className="border-danger-200 bg-danger-50">
      <CardBody className="text-center space-y-3 p-4">
        <AlertCircle className="h-8 w-8 text-danger-600 mx-auto" />
        <div>
          <h4 className="font-semibold text-danger-900">Unable to load data</h4>
          <p className="text-sm text-danger-700 mt-1">
            There was a problem loading this information. Please refresh the
            page or try again later.
          </p>
        </div>
      </CardBody>
    </Card>
  );
}

// Auth-specific error boundary
export function AuthErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      fallback={
        <Card className="max-w-sm mx-auto mt-16">
          <CardBody className="text-center space-y-4 p-6">
            <AlertCircle className="h-10 w-10 text-warning mx-auto" />
            <div>
              <h3 className="text-lg font-semibold">Authentication Error</h3>
              <p className="text-sm text-default-600 mt-2">
                There was a problem with your session. Please log in again.
              </p>
            </div>
            <Button
              as="a"
              className="w-full"
              color="primary"
              href="/login"
              variant="solid"
            >
              Go to Login
            </Button>
          </CardBody>
        </Card>
      }
    >
      {children}
    </ErrorBoundary>
  );
}
