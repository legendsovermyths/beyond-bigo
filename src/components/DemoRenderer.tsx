import React, { Suspense } from 'react';
import { demoRegistry, DemoComponentProps } from '@/lib/demoRegistry';

interface DemoRendererProps {
  demoId: string;
  props?: DemoComponentProps;
  className?: string;
}

const DemoLoadingFallback: React.FC<{ demoId: string }> = ({ demoId }) => (
  <div className="p-8 border-2 border-dashed border-muted-foreground/20 rounded-lg bg-muted/5 animate-pulse">
    <div className="flex items-center justify-center">
      <div className="flex flex-col items-center space-y-4">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-muted-foreground">
          Loading <code>{demoId}</code> demo...
        </p>
      </div>
    </div>
  </div>
);

const DemoErrorFallback: React.FC<{ demoId: string; error?: string }> = ({ demoId, error }) => (
  <div className="p-6 border-2 border-dashed border-red-300 rounded-lg bg-red-50 dark:bg-red-950 dark:border-red-700">
    <div className="flex items-start space-x-3">
      <div className="flex-shrink-0">
        <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
      </div>
      <div>
        <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
          Demo Loading Error
        </h3>
        <div className="mt-1 text-sm text-red-700 dark:text-red-300">
          <p>Failed to load demo: <code className="font-mono">{demoId}</code></p>
          {error && (
            <p className="mt-1 text-xs opacity-75">{error}</p>
          )}
        </div>
      </div>
    </div>
  </div>
);

const DemoNotFoundFallback: React.FC<{ demoId: string }> = ({ demoId }) => (
  <div className="p-6 border-2 border-dashed border-orange-300 rounded-lg bg-orange-50 dark:bg-orange-950 dark:border-orange-700">
    <div className="flex items-start space-x-3">
      <div className="flex-shrink-0">
        <svg className="w-5 h-5 text-orange-400" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      </div>
      <div>
        <h3 className="text-sm font-medium text-orange-800 dark:text-orange-200">
          Demo Not Found
        </h3>
        <div className="mt-1 text-sm text-orange-700 dark:text-orange-300">
          <p>Unknown demo type: <code className="font-mono">{demoId}</code></p>
          <p className="mt-1 text-xs opacity-75">
            Available demos: {demoRegistry.getAll().map(d => d.id).join(', ')}
          </p>
        </div>
      </div>
    </div>
  </div>
);

export const DemoRenderer: React.FC<DemoRendererProps> = ({ 
  demoId, 
  props = {}, 
  className 
}) => {
  const demo = demoRegistry.get(demoId);

  if (!demo) {
    console.warn(`Demo not found: ${demoId}`);
    return <DemoNotFoundFallback demoId={demoId} />;
  }

  const Component = demo.component;
  const mergedProps = { ...demo.defaultProps, ...props };

  return (
    <div className={className}>
      <Suspense fallback={<DemoLoadingFallback demoId={demoId} />}>
        <ErrorBoundary demoId={demoId}>
          <Component {...mergedProps} />
        </ErrorBoundary>
      </Suspense>
    </div>
  );
};

// Error boundary for demo components
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; demoId: string },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode; demoId: string }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): { hasError: boolean; error: Error } {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`Error in demo ${this.props.demoId}:`, error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <DemoErrorFallback 
          demoId={this.props.demoId} 
          error={this.state.error?.message}
        />
      );
    }

    return this.props.children;
  }
}

export default DemoRenderer;
