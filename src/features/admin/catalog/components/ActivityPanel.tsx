import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { toast } from '@/components/ui/toastStore';
import type { CatalogActivity } from '@/features/activities/types';
import { fieldErrors, toApiError } from '@/lib/api/errors';
import {
  CATEGORIES,
  CATEGORY_DEFAULT_MULTIPLIER,
  CATEGORY_LABEL,
  type Category,
} from '@/lib/api/types';
import { formatMultiplier } from '@/lib/utils/format';
import { useCreateActivity, useUpdateActivity } from '../api';
import {
  formFor,
  isEmptyPatch,
  nameTaken,
  toCreateBody,
  toPatchBody,
  type ActivityFormValues,
} from '../catalog';
import { ACTIVITY_FIELDS, activitySchema } from '../schemas';

type ActivityPanelProps = {
  /** The activity being edited, or undefined for a new one. */
  activity?: CatalogActivity;
  /** Every activity, for the duplicate-name check. */
  rows: readonly CatalogActivity[];
  onDone: () => void;
};

/** The form beside the table: a new activity, or the one being edited. */
export function ActivityPanel({ activity, rows, onDone }: ActivityPanelProps) {
  const editing = activity !== undefined;
  const create = useCreateActivity();
  const update = useUpdateActivity();
  const form = useForm<ActivityFormValues>({
    resolver: zodResolver(activitySchema),
    defaultValues: formFor(activity),
  });
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = form;

  const values = useWatch({ control });
  const category = (values.category ?? 'STUDY') as Category;
  const taken = nameTaken(rows, values.name ?? '', activity?.id);
  const unchanged =
    editing && activity
      ? isEmptyPatch(
          toPatchBody({ ...formFor(activity), ...values } as ActivityFormValues, activity),
        )
      : false;
  const pending = create.isPending || update.isPending;

  function failed(err: unknown) {
    if (toApiError(err).status === 409) {
      setError('name', { message: 'An activity with this name already exists' });
      return;
    }
    const fields = fieldErrors(err, ACTIVITY_FIELDS);
    if (fields) {
      for (const [field, message] of Object.entries(fields)) {
        setError(field === 'xpMultiplier' ? 'multiplier' : (field as keyof ActivityFormValues), {
          message,
        });
      }
      return;
    }
    toast.error("Couldn't save the activity. Try again.");
  }

  const submit = handleSubmit((v) => {
    if (editing && activity) {
      update.mutate(
        { id: activity.id, body: toPatchBody(v, activity) },
        {
          onSuccess: () => {
            toast.success(`Saved ${v.name.trim()}`);
            onDone();
          },
          onError: failed,
        },
      );
    } else {
      create.mutate(toCreateBody(v), {
        onSuccess: () => {
          toast.success(`Created ${v.name.trim()}`);
          onDone();
        },
        onError: failed,
      });
    }
  });

  return (
    <form onSubmit={submit} noValidate className="flex min-h-full flex-col gap-5">
      <Input
        label="Name"
        autoComplete="off"
        error={
          errors.name?.message ?? (taken ? 'An activity with this name already exists' : undefined)
        }
        {...register('name')}
      />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="activity-category" className="text-sm font-medium text-soft">
          Category
        </label>
        <select
          id="activity-category"
          className="min-h-11 rounded-xl border border-line-strong bg-surface-2 px-3.5 text-text"
          {...register('category')}
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {CATEGORY_LABEL[c]}
            </option>
          ))}
        </select>
      </div>

      <Input
        label="XP multiplier"
        type="number"
        inputMode="decimal"
        step="0.1"
        min="0"
        placeholder={String(CATEGORY_DEFAULT_MULTIPLIER[category])}
        hint={`${CATEGORY_LABEL[category]} defaults to ${formatMultiplier(CATEGORY_DEFAULT_MULTIPLIER[category])}. Leave blank to use it.`}
        error={errors.multiplier?.message}
        {...register('multiplier')}
      />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="activity-description" className="text-sm font-medium text-soft">
          Description
        </label>
        <textarea
          id="activity-description"
          rows={3}
          className="rounded-xl border border-line-strong bg-surface-2 px-3.5 py-2.5 text-text"
          {...register('description')}
        />
      </div>

      <label className="flex min-h-11 items-center gap-3">
        <input type="checkbox" className="size-5" {...register('active')} />
        <span>
          Active
          <span className="block text-sm text-muted">
            Inactive activities are hidden from the Log screen and cannot be logged.
          </span>
        </span>
      </label>

      <div className="mt-auto flex gap-3 border-t border-line pt-4">
        <Button type="submit" loading={pending} disabled={taken || unchanged}>
          {editing ? 'Save changes' : 'Create activity'}
        </Button>
        <Button variant="ghost" onClick={onDone}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
