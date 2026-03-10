"use client";

import React, { Component, type ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/**
 * Reusable error boundary that catches render errors and
 * displays a styled fallback instead of crashing the page.
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 p-12 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/20 text-2xl text-red-400">
            !
          </div>
          <h3 className="mb-2 text-lg font-semibold text-white">
            Something went wrong
          </h3>
          <p className="mb-6 max-w-sm text-sm text-gray-400">
            This section encountered an error. Your data is safe — try
            refreshing.
          </p>
          <button
            onClick={this.handleReset}
            className="rounded-xl bg-accent-orange px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-orange-600"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
