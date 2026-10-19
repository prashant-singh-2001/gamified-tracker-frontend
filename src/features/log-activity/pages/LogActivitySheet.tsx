import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { useCatalog } from '@/features/activities/api';
import { getActivitySuggestions, type ActivitySuggestion } from '@/lib/api/errors';
import { toServerDateTime } from '@/lib/utils/serverTime';
import { useLogActivity, useNaturalDraft } from '../api';
import { ConfirmCard } from '../components/ConfirmCard';
import { LogForm } from '../components/LogForm';
import { NaturalInput } from '../components/NaturalInput';
import {
  confirmFromDraft,
  confirmFromForm,
  EMPTY_FORM,
  formFromConfirm,
  type ConfirmValue,
} from '../flow';
import { mapLogError, type LogError } from '../logErrors';
import type { LogFormValues } from '../schemas';

type QuickLog = 'on' | 'disabled' | 'unavailable';
type Suggestions = { requestedName: string; suggestions: ActivitySuggestion[] };

/**
 * Log Activity, opened over Home. Both entry modes end at the same confirm card, and only
 * "Log it" calls POST /activitylog/ — a typed sentence is merely previewed first.
 */
export default function LogActivitySheet() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const catalog = useCatalog();
  const natural = useNaturalDraft();
  const logActivity = useLogActivity();

  const [view, setView] = useState<'input' | 'confirm'>('input');
  const [formKey, setFormKey] = useState(0);
  const [initial, setInitial] = useState<LogFormValues>({
    ...EMPTY_FORM,
    activityName: params.get('activity') ?? '',
  });
  const [confirm, setConfirm] = useState<ConfirmValue | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [quickLog, setQuickLog] = useState<QuickLog>('on');
  const [serverError, setServerError] = useState<LogError | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestions | null>(null);

  function backToForm(from: ConfirmValue, extras: { error?: LogError; suggestions?: Suggestions }) {
    setInitial(formFromConfirm(from));
    setFormKey((k) => k + 1); // remount the form so it picks up the new defaults
    setServerError(extras.error ?? null);
    setSuggestions(extras.suggestions ?? null);
    setView('input');
  }

  function onNatural(text: string) {
    natural.mutate(
      { text },
      {
        onSuccess: (res) => {
          setNotice(null);
          if (res.status === 'PARSED' && res.draft) {
            setConfirm(confirmFromDraft(res.draft, res.interpretation, res.nameResolution));
            setServerError(null);
            setSuggestions(null);
            setView('confirm');
          } else if (res.status === 'NEEDS_CLARIFICATION') {
            setNotice(
              res.interpretation ?? "We couldn't tell how long that took. Use the form below.",
            );
          } else if (res.status === 'DISABLED') {
            setQuickLog('disabled');
          } else {
            setQuickLog('unavailable');
          }
        },
      },
    );
  }

  function onContinue(values: LogFormValues) {
    setConfirm(confirmFromForm(values));
    setServerError(null);
    setSuggestions(null);
    setView('confirm');
  }

  function onConfirm() {
    if (!confirm) return;
    logActivity.mutate(
      {
        activityName: confirm.activityName,
        startTime: toServerDateTime(confirm.start),
        endTime: toServerDateTime(confirm.end),
        notes: confirm.notes || null,
      },
      {
        onSuccess: (log) => {
          void navigate(`/app/log/result/${log.id}`, { replace: true });
        },
        onError: (err) => {
          const didYouMean = getActivitySuggestions(err);
          if (didYouMean) return backToForm(confirm, { suggestions: didYouMean });
          const mapped = mapLogError(err);
          // Field errors go back to the form, next to the field; the rest stay on the card.
          if (mapped.target !== 'form') backToForm(confirm, { error: mapped });
        },
      },
    );
  }

  const confirmError =
    logActivity.isError && mapLogError(logActivity.error).target === 'form'
      ? mapLogError(logActivity.error).message
      : null;

  return (
    <BottomSheet open onClose={() => void navigate('/app')} title="Log activity">
      {view === 'confirm' && confirm ? (
        <ConfirmCard
          value={confirm}
          pending={logActivity.isPending}
          error={confirmError}
          onConfirm={onConfirm}
          onEdit={() => backToForm(confirm, {})}
        />
      ) : (
        <div className="flex flex-col gap-5">
          {quickLog === 'on' && (
            <>
              <NaturalInput
                onSubmit={onNatural}
                pending={natural.isPending}
                error={natural.isError ? natural.error : null}
              />
              {notice && (
                <p role="status" className="rounded-xl border border-line-strong bg-surface-2 p-3">
                  {notice}
                </p>
              )}
              <div className="flex items-center gap-3 text-sm text-muted" aria-hidden="true">
                <span className="h-px flex-1 bg-line" />
                or
                <span className="h-px flex-1 bg-line" />
              </div>
            </>
          )}
          {quickLog === 'unavailable' && (
            <p role="status" className="rounded-xl border border-line-strong bg-surface-2 p-3">
              Quick log is unavailable right now. Use the form below.
            </p>
          )}
          <LogForm
            key={formKey}
            initial={initial}
            activities={catalog.data ?? []}
            serverError={serverError}
            suggestions={suggestions}
            onEdit={() => {
              if (serverError) setServerError(null);
              if (suggestions) setSuggestions(null);
            }}
            onContinue={onContinue}
          />
        </div>
      )}
    </BottomSheet>
  );
}
