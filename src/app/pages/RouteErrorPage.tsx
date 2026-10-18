import { isRouteErrorResponse, useRouteError } from 'react-router';
import { ErrorPanel } from '@/components/ui/ErrorPanel';

/** Root error boundary: render errors and failed lazy-chunk loads end up here. */
export default function RouteErrorPage() {
  const error = useRouteError();
  const message = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : error instanceof Error
      ? error.message
      : 'Unexpected error';

  return (
    <div className="mx-auto max-w-xl px-6 py-12">
      <ErrorPanel
        error={new Error(message)}
        title="This page failed to load"
        onRetry={() => window.location.reload()}
      />
    </div>
  );
}
