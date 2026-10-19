import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { formatDuration, formatTimeRange } from '@/lib/utils/format';
import { minutesOf, type ConfirmValue } from '../flow';

type ConfirmCardProps = {
  value: ConfirmValue;
  pending: boolean;
  /** A rejection that doesn't belong to a specific field. */
  error: string | null;
  onConfirm: () => void;
  onEdit: () => void;
};

/** Everything the user is about to log. Nothing has been saved until "Log it". */
export function ConfirmCard({ value, pending, error, onConfirm, onEdit }: ConfirmCardProps) {
  const resolution = value.nameResolution;

  return (
    <div className="flex flex-col gap-4">
      {value.interpretation && (
        <p className="rounded-xl border border-line-strong bg-surface-2 p-3 text-soft">
          {value.interpretation}
        </p>
      )}

      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 rounded-xl border border-line bg-surface-2 p-4">
        <dt className="text-muted">Activity</dt>
        <dd className="font-bold">{resolution ? resolution.resolvedName : value.activityName}</dd>
        <dt className="text-muted">When</dt>
        <dd>{formatTimeRange(value.start, value.end)}</dd>
        <dt className="text-muted">Duration</dt>
        <dd className="font-mono">{formatDuration(minutesOf(value))}</dd>
        {value.notes && (
          <>
            <dt className="text-muted">Note</dt>
            <dd className="text-soft">{value.notes}</dd>
          </>
        )}
      </dl>

      {resolution && (
        <p className="text-sm text-soft" role="status">
          Will be logged as <strong className="text-text">{resolution.resolvedName}</strong> (you
          typed <em>{resolution.requestedName}</em>).{' '}
          <button
            type="button"
            onClick={onEdit}
            className="min-h-11 font-medium text-accent hover:underline"
          >
            Change
          </button>
        </p>
      )}

      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <Button size="lg" loading={pending} onClick={onConfirm} className="flex-1">
          Log it
        </Button>
        <Button variant="secondary" size="lg" disabled={pending} onClick={onEdit}>
          <Pencil className="size-4" aria-hidden="true" />
          Edit
        </Button>
      </div>
    </div>
  );
}
