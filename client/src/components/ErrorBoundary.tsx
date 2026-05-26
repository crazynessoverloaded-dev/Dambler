import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary
 * Catches unhandled React render errors and shows a fallback UI
 * instead of crashing the entire app.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="glass-effect rounded-2xl p-10 max-w-md w-full text-center border border-destructive/30">
          <h1 className="text-2xl font-bold text-foreground mb-3">
            Something went wrong
          </h1>
          <p className="text-sm text-muted-foreground mb-6">
            {this.state.error?.message ?? "An unexpected error occurred."}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-accent text-primary-foreground rounded-lg text-sm font-semibold hover:bg-accent/90 transition-colors"
          >
            Reload page
          </button>
        </div>
      </div>
    );
  }
}
