import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode | ((error: Error, reset: () => void) => ReactNode);
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Unhandled render error caught by SupplySetu ErrorBoundary:', error, errorInfo);
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  handleReload = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        if (typeof this.props.fallback === 'function') {
          return this.props.fallback(this.state.error, this.handleReset);
        }
        return this.props.fallback;
      }

      return (
        <div
          role="alert"
          className="min-h-[320px] w-full flex flex-col items-center justify-center p-6 text-center bg-slate-50 dark:bg-[#0E1015] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm m-auto max-w-lg my-8"
        >
          <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6" />
          </div>

          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
            Something went wrong
          </h2>

          <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 max-w-md">
            An unexpected error occurred while rendering this section. You can try recovering the
            view or refreshing the page.
          </p>

          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Try Again
            </button>
            <button
              onClick={this.handleReload}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reload Application
            </button>
          </div>

          {import.meta.env.DEV && this.state.error && (
            <details className="w-full text-left bg-slate-100 dark:bg-slate-900/60 p-3 rounded-lg text-xs font-mono text-rose-600 dark:text-rose-400 overflow-x-auto max-h-48 border border-slate-200 dark:border-slate-800">
              <summary className="cursor-pointer font-bold select-none mb-1">
                {this.state.error.name}: {this.state.error.message}
              </summary>
              <pre className="whitespace-pre-wrap text-[11px] leading-tight opacity-80">
                {this.state.error.stack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
