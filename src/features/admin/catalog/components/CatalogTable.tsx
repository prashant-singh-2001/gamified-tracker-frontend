import { useState } from 'react';
import { Link } from 'react-router';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { buttonClass } from '@/components/ui/buttonStyles';
import { toast } from '@/components/ui/toastStore';
import { effectiveMultiplier, type CatalogActivity } from '@/features/activities/types';
import { CATEGORY_LABEL } from '@/lib/api/types';
import { cn } from '@/lib/utils/cn';
import { CATEGORY_ICON } from '@/lib/utils/category';
import { formatDate, formatMultiplier } from '@/lib/utils/format';
import { useRemoveActivity, useUpdateActivity } from '../api';
import { isDefaultMultiplier } from '../catalog';

type CatalogTableProps = {
  rows: readonly CatalogActivity[];
  onEdit: (activity: CatalogActivity) => void;
};

/** The catalog: switch an activity on or off, edit it, or delete it (with a confirm first). */
export function CatalogTable({ rows, onEdit }: CatalogTableProps) {
  const update = useUpdateActivity();
  const remove = useRemoveActivity();
  const [confirming, setConfirming] = useState<number | null>(null);

  function toggle(a: CatalogActivity) {
    update.mutate(
      { id: a.id, body: { active: !a.active } },
      {
        onSuccess: () =>
          toast.success(a.active ? `Deactivated ${a.name}` : `Reactivated ${a.name}`),
        onError: () => toast.error("Couldn't change that activity. Try again."),
      },
    );
  }

  function confirmDelete(a: CatalogActivity) {
    remove.mutate(a.id, {
      onSuccess: (result) => {
        setConfirming(null);
        toast.success(
          result.result === 'REMOVED'
            ? `Removed ${a.name}`
            : `Deactivated ${a.name}. It has logs, so it stays in History.`,
        );
      },
      onError: () => toast.error("Couldn't delete that activity. Try again."),
    });
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
      <table className="w-full min-w-[56rem] border-collapse text-left text-[15px]">
        <caption className="sr-only">Activities</caption>
        <thead>
          <tr className="border-b border-line text-sm text-muted">
            <th scope="col" className="px-4 py-3 font-medium">
              Name
            </th>
            <th scope="col" className="px-2 py-3 font-medium">
              Category
            </th>
            <th scope="col" className="px-2 py-3 font-medium">
              XP multiplier
            </th>
            <th scope="col" className="px-2 py-3 font-medium">
              Active
            </th>
            <th scope="col" className="px-2 py-3 font-medium">
              Description
            </th>
            <th scope="col" className="px-2 py-3 font-medium">
              Created
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((a) => {
            const Icon = CATEGORY_ICON[a.category];
            return (
              <tr
                key={a.id}
                className={cn(
                  'border-b border-line align-top last:border-0',
                  !a.active && 'text-muted',
                )}
              >
                <td className="px-4 py-3 font-medium">
                  {a.name}
                  {!a.active && (
                    <span className="ml-2 rounded-full border border-line-strong px-2 py-0.5 text-xs font-normal">
                      Inactive
                    </span>
                  )}
                </td>
                <td className="px-2 py-3 whitespace-nowrap">
                  <span className="inline-flex items-center gap-2">
                    <Icon className="size-4" aria-hidden="true" />
                    {CATEGORY_LABEL[a.category]}
                  </span>
                </td>
                <td className="px-2 py-3 whitespace-nowrap">
                  <span className="font-mono font-bold">
                    {formatMultiplier(effectiveMultiplier(a))}
                  </span>
                  <span className="block text-sm text-muted">
                    {isDefaultMultiplier(a) ? 'category default' : 'override'}
                  </span>
                </td>
                <td className="px-2 py-3">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={a.active}
                    aria-label={`${a.name} is active`}
                    disabled={update.isPending}
                    onClick={() => toggle(a)}
                    className={cn(
                      'relative h-7 w-12 rounded-full border transition-colors',
                      a.active ? 'border-text bg-text' : 'border-line-strong bg-surface-2',
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        'absolute top-0.5 size-5 rounded-full transition-all',
                        a.active ? 'left-6 bg-bg' : 'left-0.5 bg-text-faint',
                      )}
                    />
                  </button>
                </td>
                <td className="max-w-64 px-2 py-3 text-soft">
                  <span className="line-clamp-2">{a.description}</span>
                </td>
                <td className="px-2 py-3 whitespace-nowrap text-muted">
                  {formatDate(a.createdAt)}
                </td>
                <td className="px-4 py-3">
                  {confirming === a.id ? (
                    <div className="flex flex-col gap-2">
                      <p className="text-sm">
                        Delete {a.name}? If it has logs it is only deactivated.
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="danger"
                          loading={remove.isPending}
                          onClick={() => confirmDelete(a)}
                        >
                          Delete
                        </Button>
                        <Button variant="ghost" onClick={() => setConfirming(null)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-1">
                      <Link
                        to={`/app/activities/${a.id}`}
                        aria-label={`View ${a.name}`}
                        className={buttonClass('ghost')}
                      >
                        <Eye className="size-4" aria-hidden="true" />
                        View
                      </Link>
                      <Button
                        variant="ghost"
                        aria-label={`Edit ${a.name}`}
                        onClick={() => onEdit(a)}
                      >
                        <Pencil className="size-4" aria-hidden="true" />
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        aria-label={`Delete ${a.name}`}
                        onClick={() => setConfirming(a.id)}
                      >
                        <Trash2 className="size-4" aria-hidden="true" />
                      </Button>
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
