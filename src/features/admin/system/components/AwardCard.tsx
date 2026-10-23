import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { toast } from '@/components/ui/toastStore';
import { toApiError } from '@/lib/api/errors';
import { useUserId } from '@/lib/auth/useUserId';
import { formatNumber } from '@/lib/utils/format';
import { useAdminCatalog } from '../../catalog/api';
import type { LevelTracker } from '@/features/activities/types';
import { useAwardXp } from '../api';
import { AWARD_CAP, awardErrors, hasErrors, type AwardErrors } from '../system';

type Pending = { target: number | undefined; activityId: number; xp: number };

/**
 * Manual XP skips every normal check (and is audited), so the final click is preceded by a
 * sentence that repeats who gets what back. The API stores no reason, so none is asked for.
 */
export function AwardCard() {
  const me = useUserId();
  const catalog = useAdminCatalog();
  const award = useAwardXp();
  const [user, setUser] = useState('');
  const [activityId, setActivityId] = useState<number | null>(null);
  const [xp, setXp] = useState('');
  const [errors, setErrors] = useState<AwardErrors>({});
  const [pending, setPending] = useState<Pending | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [result, setResult] = useState<{ text: string; leveledUp: boolean } | null>(null);

  const activityName = (id: number) =>
    catalog.data?.find((a) => a.id === id)?.name ?? `Activity #${id}`;
  const who = (target: number | undefined) =>
    target === undefined ? `yourself${me ? ` (User #${me})` : ''}` : `User #${target}`;

  function review(e: FormEvent) {
    e.preventDefault();
    setResult(null);
    setServerError(null);
    const found = awardErrors({ user, activityId, xp });
    setErrors(found);
    if (hasErrors(found) || activityId === null) return;
    setPending({
      target: user.trim() === '' ? undefined : Number(user),
      activityId,
      xp: Number(xp),
    });
  }

  function confirm(p: Pending) {
    award.mutate(
      { targetUserId: p.target, activityId: p.activityId, xp: p.xp },
      {
        onSuccess: (t: LevelTracker) => {
          const name = activityName(p.activityId);
          setResult({
            text: `${who(p.target)} ${p.target === undefined ? 'are' : 'is'} now level ${t.level} in ${name} with ${formatNumber(Math.round(t.totalXp))} XP.`,
            leveledUp: t.leveledUp,
          });
          toast.success(`Awarded ${formatNumber(p.xp)} XP in ${name}`);
          setPending(null);
          setUser('');
          setXp('');
        },
        onError: (err) => {
          const api = toApiError(err);
          if (api.status === 400 || api.status === 404) setServerError(api.message);
          else toast.error("Couldn't award the XP. Try again.");
        },
      },
    );
  }

  return (
    <Card className="flex flex-col gap-4" role="region" aria-labelledby="award-title">
      <div>
        <h2 id="award-title" className="font-display text-3xl leading-none font-extrabold">
          Award XP manually
        </h2>
        <p className="mt-1 max-w-prose text-soft">
          Gives XP straight to a user, skipping the normal checks. Every award is recorded against
          your account. At most {formatNumber(AWARD_CAP)} XP at a time.
        </p>
      </div>

      <form onSubmit={review} noValidate className="flex flex-wrap items-start gap-3">
        <div className="w-48">
          <Input
            label="User number"
            inputMode="numeric"
            placeholder="Blank for yourself"
            value={user}
            error={errors.user}
            onChange={(e) => setUser(e.target.value)}
          />
        </div>
        <div className="flex w-52 flex-col gap-1.5">
          <label htmlFor="award-activity" className="text-sm font-medium text-soft">
            Activity
          </label>
          <select
            id="award-activity"
            value={activityId ?? ''}
            onChange={(e) => setActivityId(e.target.value ? Number(e.target.value) : null)}
            aria-invalid={errors.activityId ? true : undefined}
            className="min-h-11 rounded-xl border border-line-strong bg-surface-2 px-3.5"
          >
            <option value="">Choose…</option>
            {(catalog.data ?? []).map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
          {errors.activityId && (
            <p role="alert" className="text-sm text-danger">
              {errors.activityId}
            </p>
          )}
        </div>
        <div className="w-36">
          <Input
            label="XP"
            type="number"
            min="0"
            max={AWARD_CAP}
            value={xp}
            error={errors.xp}
            onChange={(e) => setXp(e.target.value)}
          />
        </div>
        <Button type="submit" variant="secondary" className="mt-[26px]" disabled={pending !== null}>
          Review award
        </Button>
      </form>

      {pending && (
        <div
          role="alertdialog"
          aria-label="Confirm the award"
          className="flex flex-col gap-3 rounded-xl border border-text p-4"
        >
          <p className="font-medium">
            Award {formatNumber(pending.xp)} XP in {activityName(pending.activityId)} to{' '}
            {who(pending.target)}?
          </p>
          <p className="text-sm text-soft">This cannot be undone from this screen.</p>
          {serverError && (
            <p role="alert" className="text-sm text-danger">
              {serverError}
            </p>
          )}
          <div className="flex gap-2">
            <Button loading={award.isPending} onClick={() => confirm(pending)}>
              Award XP
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setPending(null);
                setServerError(null);
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {result && (
        <p aria-live="polite" className="font-medium">
          {result.text}
          {result.leveledUp && ' That crossed a level.'}
        </p>
      )}
    </Card>
  );
}
