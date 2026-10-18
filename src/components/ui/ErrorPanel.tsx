import { AlertTriangle } from 'lucide-react';
import { getErrorMessage } from '@/lib/api/errors';
import { Button } from './Button';

type ErrorPanelProps = {
  error: unknown;
  onRetry?: () => void;
  title?: string;
};

export function ErrorPanel({ error, onRetry, title = 'Something went wrong' }: ErrorPanelProps) {
  return (
    <div
      role="alert"
      className="flex flex-col items-start gap-3 rounded-2xl border border-danger/40 bg-surface p-5"
    >
      <div className="flex items-center gap-2 font-display text-lg font-bold">
        <AlertTriangle className="size-5 text-danger" aria-hidden="true" />
        {title}
      </div>
      <p className="text-soft">{getErrorMessage(error)}</p>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
