import React from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error?.message || 'An unexpected display error occurred.'
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('[SETU ErrorBoundary] Caught runtime error:', error, errorInfo);
  }

  handleReload = (): void => {
    this.setState({ hasError: false, errorMessage: '' });
    window.location.reload();
  };

  handleGoHome = (): void => {
    this.setState({ hasError: false, errorMessage: '' });
    window.location.href = '/';
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F8FCFF] text-[#334155] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white border border-[#D8ECFA] rounded-3xl p-8 text-center space-y-5 shadow-baby">
            <div className="w-14 h-14 rounded-2xl bg-[#EAF7FF] border border-[#BDE0FE] text-[#3B9EE8] flex items-center justify-center mx-auto">
              <AlertCircle className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h1 className="text-xl font-bold text-[#334155] font-display">
                Something went wrong
              </h1>
              <p className="text-xs text-[#64748B] leading-relaxed">
                SETU encountered an unexpected display error. Your account and profile data are completely safe.
              </p>
              {this.state.errorMessage && (
                <p className="text-[11px] text-[#64748B] bg-[#F8FCFF] border border-[#D8ECFA] rounded-2xl p-3 font-mono break-words">
                  {this.state.errorMessage}
                </p>
              )}
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#A2D2FF] to-[#BDE0FE] hover:from-[#8CC6FA] hover:to-[#A2D2FF] text-[#1E3A5F] text-xs font-bold shadow-baby-sm transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reload Page</span>
              </button>
              <button
                type="button"
                onClick={this.handleGoHome}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#EAF7FF] hover:bg-[#D6EEFF] text-[#334155] border border-[#D8ECFA] text-xs font-semibold transition"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Go Home</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
