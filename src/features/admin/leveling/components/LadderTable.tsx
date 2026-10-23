import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils/cn';
import { formatNumber } from '@/lib/utils/format';
import type { StepRow } from '../curve';

type LadderTableProps = {
  rows: readonly StepRow[];
  /** Only an activity's own rows can be changed; the default curve is read-only. */
  editable: boolean;
  /** The level whose XP is being changed, and the value in the field. */
  editing: { level: number; xp: string } | null;
  onEditing: (next: { level: number; xp: string } | null) => void;
  onSaveEdit: () => void;
  onDelete: (level: number) => void;
  error?: string | null;
};

/** Level, cumulative XP and what each level adds, with edit and delete for explicit rows. */
export function LadderTable({
  rows,
  editable,
  editing,
  onEditing,
  onSaveEdit,
  onDelete,
  error,
}: LadderTableProps) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
      <table className="w-full min-w-[28rem] border-collapse text-left text-[15px]">
        <caption className="sr-only">Level ladder</caption>
        <thead>
          <tr className="border-b border-line text-sm text-muted">
            <th scope="col" className="px-4 py-3 font-medium">
              Level
            </th>
            <th scope="col" className="px-2 py-3 text-right font-medium">
              XP required
            </th>
            <th scope="col" className="px-2 py-3 text-right font-medium">
              Adds
            </th>
            {editable && (
              <th scope="col" className="px-4 py-3 font-medium">
                <span className="sr-only">Actions</span>
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const isEditing = editing?.level === row.level;
            return (
              <tr key={row.level} className="border-b border-line last:border-0">
                <th scope="row" className="px-4 py-2.5 font-medium">
                  Level {row.level}
                </th>
                <td className="px-2 py-2.5 text-right font-mono">
                  {isEditing ? (
                    <input
                      type="number"
                      min="0"
                      aria-label={`XP required for level ${row.level}`}
                      value={editing.xp}
                      onChange={(e) => onEditing({ level: row.level, xp: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') onSaveEdit();
                        if (e.key === 'Escape') onEditing(null);
                      }}
                      className="min-h-10 w-32 rounded-lg border border-line-strong bg-surface-2 px-2 text-right"
                    />
                  ) : (
                    formatNumber(Math.round(row.xpRequired))
                  )}
                </td>
                <td
                  className={cn(
                    'px-2 py-2.5 text-right font-mono text-muted',
                    row.step !== null && row.step <= 0 && 'text-danger',
                  )}
                >
                  {row.step === null ? '' : `+${formatNumber(Math.round(row.step))}`}
                </td>
                {editable && (
                  <td className="px-4 py-1.5">
                    {isEditing ? (
                      <div className="flex gap-1">
                        <Button onClick={onSaveEdit}>Save</Button>
                        <Button variant="ghost" onClick={() => onEditing(null)}>
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          aria-label={`Edit level ${row.level}`}
                          onClick={() =>
                            onEditing({ level: row.level, xp: String(row.xpRequired) })
                          }
                        >
                          <Pencil className="size-4" aria-hidden="true" />
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          aria-label={`Delete level ${row.level}`}
                          onClick={() => onDelete(row.level)}
                        >
                          <Trash2 className="size-4" aria-hidden="true" />
                        </Button>
                      </div>
                    )}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
      {error && (
        <p role="alert" className="border-t border-line px-4 py-3 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
