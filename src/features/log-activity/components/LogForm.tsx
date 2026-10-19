import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import { Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { CatalogActivity } from '@/features/activities/types';
import { cn } from '@/lib/utils/cn';
import { logFormSchema, type LogFormValues } from '../schemas';
import {
  clampDuration,
  DURATION_CHIPS,
  DURATION_STEP,
  ENDED_OPTIONS,
  MAX_DURATION,
  toDateTimeLocal,
} from '../timing';
import type { LogError } from '../logErrors';
import type { ActivitySuggestion } from '@/lib/api/errors';
import { ActivityPicker } from './ActivityPicker';
import { SuggestionChips } from './SuggestionChips';

type LogFormProps = {
  initial: LogFormValues;
  activities: readonly CatalogActivity[];
  /** A rejection from the server, shown under the field it belongs to. */
  serverError: LogError | null;
  suggestions: { requestedName: string; suggestions: ActivitySuggestion[] } | null;
  /** The user changed something, so a stale server error should go away. */
  onEdit: () => void;
  onContinue: (values: LogFormValues) => void;
};

const chip = (selected: boolean) =>
  cn(
    'min-h-11 rounded-full border px-4 text-[15px] font-medium transition',
    selected
      ? 'border-accent bg-accent/15 text-accent'
      : 'border-line-strong text-soft hover:text-text',
  );

/** The structured entry: activity, how long, when it ended, optional note. */
export function LogForm({
  initial,
  activities,
  serverError,
  suggestions,
  onEdit,
  onContinue,
}: LogFormProps) {
  const {
    register,
    handleSubmit,
    control,
    getValues,
    setValue,
    formState: { errors },
  } = useForm<LogFormValues>({ resolver: zodResolver(logFormSchema), defaultValues: initial });
  const [showNotes, setShowNotes] = useState(initial.notes !== '');

  const name = useWatch({ control, name: 'activityName' });
  const duration = useWatch({ control, name: 'durationMinutes' });
  const ended = useWatch({ control, name: 'ended' });

  const setDuration = (minutes: number) => {
    setValue('durationMinutes', clampDuration(minutes), { shouldValidate: true });
    onEdit();
  };
  const errorFor = (target: LogError['target']) =>
    serverError?.target === target ? serverError.message : undefined;

  return (
    <form
      onSubmit={handleSubmit(onContinue)}
      onChange={onEdit}
      noValidate
      className="flex flex-col gap-5"
    >
      <div className="flex flex-col gap-2">
        <ActivityPicker
          value={name}
          onChange={(v) => {
            setValue('activityName', v, { shouldValidate: true });
            onEdit();
          }}
          activities={activities}
          error={errors.activityName?.message ?? errorFor('activityName')}
        />
        {suggestions && (
          <SuggestionChips
            requestedName={suggestions.requestedName}
            suggestions={suggestions.suggestions}
            onPick={(picked) => {
              setValue('activityName', picked, { shouldValidate: true });
              onEdit();
            }}
          />
        )}
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-medium text-soft">How long?</legend>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            aria-label="15 minutes less"
            onClick={() => setDuration((Number.isFinite(duration) ? duration : 0) - DURATION_STEP)}
          >
            <Minus className="size-4" aria-hidden="true" />
          </Button>
          <input
            type="number"
            inputMode="numeric"
            aria-label="Minutes"
            min={1}
            max={MAX_DURATION}
            aria-invalid={errors.durationMinutes || errorFor('duration') ? true : undefined}
            {...register('durationMinutes', { valueAsNumber: true })}
            className="min-h-11 w-24 rounded-xl border border-line-strong bg-surface-2 px-3 text-center font-mono text-lg text-text"
          />
          <span className="text-soft">min</span>
          <Button
            variant="secondary"
            aria-label="15 minutes more"
            onClick={() => setDuration((Number.isFinite(duration) ? duration : 0) + DURATION_STEP)}
          >
            <Plus className="size-4" aria-hidden="true" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {DURATION_CHIPS.map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={duration === m}
              onClick={() => setDuration(m)}
              className={chip(duration === m)}
            >
              {m} min
            </button>
          ))}
        </div>
        {(errors.durationMinutes?.message ?? errorFor('duration')) && (
          <p role="alert" className="text-sm text-danger">
            {errors.durationMinutes?.message ?? errorFor('duration')}
          </p>
        )}
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-medium text-soft">Ended</legend>
        <div className="flex flex-wrap gap-2">
          {ENDED_OPTIONS.map((o) => (
            <button
              key={o.id}
              type="button"
              aria-pressed={ended === o.id}
              onClick={() => {
                setValue('ended', o.id, { shouldValidate: true });
                if (o.id === 'custom' && !getValues('endedCustom')) {
                  setValue('endedCustom', toDateTimeLocal(new Date()));
                }
                onEdit();
              }}
              className={chip(ended === o.id)}
            >
              {o.label}
            </button>
          ))}
        </div>
        {ended === 'custom' && (
          <Input
            label="When did it end?"
            type="datetime-local"
            max={toDateTimeLocal(new Date())}
            error={errors.endedCustom?.message}
            {...register('endedCustom')}
          />
        )}
        {errorFor('ended') && (
          <p role="alert" className="text-sm text-danger">
            {errorFor('ended')}
          </p>
        )}
      </fieldset>

      {showNotes ? (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="log-notes" className="text-sm font-medium text-soft">
            Note
          </label>
          <textarea
            id="log-notes"
            rows={2}
            {...register('notes')}
            className="resize-none rounded-xl border border-line-strong bg-surface-2 px-3.5 py-3 text-text"
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowNotes(true)}
          className="min-h-11 self-start text-[15px] font-medium text-accent hover:underline"
        >
          Add a note
        </button>
      )}

      {serverError?.target === 'form' && (
        <p role="alert" className="text-sm text-danger">
          {serverError.message}
        </p>
      )}

      <Button type="submit" size="lg">
        Review
      </Button>
    </form>
  );
}
