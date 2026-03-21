import { Component, type ErrorInfo, type PropsWithChildren } from "react";

interface ErrorBoundaryState {
  error: Error | null;
}

export class ErrorBoundary extends Component<
  PropsWithChildren,
  ErrorBoundaryState
> {
  constructor(props: PropsWithChildren) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("Uncaught error in React tree:", error, info.componentStack);
  }

  override render() {
    if (!this.state.error) {
      return this.props.children;
    }

    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
        <div className="mx-auto max-w-md space-y-4 text-center">
          <h1 className="text-lg font-semibold tracking-tight">
            Something went wrong
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            An unexpected error prevented CapyFin from rendering. Try reloading
            the app. If the problem persists, please report it.
          </p>
          <pre className="max-h-40 overflow-auto rounded-lg border border-border/60 bg-muted/50 px-4 py-3 text-left text-xs text-muted-foreground">
            {this.state.error.message}
          </pre>
          <button
            type="button"
            className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            onClick={() => {
              window.location.reload();
            }}
          >
            Reload app
          </button>
        </div>
      </div>
    );
  }
}
