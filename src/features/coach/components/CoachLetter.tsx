import { useMemo } from 'react';
import { buildContours } from '@/components/route-map/contours';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/utils/cn';
import type { NarrativeStatus } from '../types';
import { paragraphs, weekLabel } from '../text';
import './coach.css';

type CoachLetterProps = {
  /** Null while the first note is still being written. */
  week: { start: string; end: string } | null;
  status: NarrativeStatus | 'loading';
  narrative: string | null;
  /** When the note arrived, for the sign-off. */
  writtenAt: number;
  /** A new note is being written (the old one stays on the page until it arrives). */
  writing: boolean;
  onWrite: () => void;
};

/** Faint contour lines in the corner, so the sheet reads as a page from the climb's notebook. */
function Contours() {
  const rings = useMemo(() => buildContours(), []);
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 900 760"
      className="pointer-events-none absolute -top-24 -right-40 w-[34rem] text-line-strong opacity-50"
    >
      {rings.map((ring, i) => (
        <path
          key={i}
          d={ring.d}
          fill="none"
          stroke="currentColor"
          strokeWidth={ring.major ? 2 : 1}
          opacity={ring.major ? 1 : 0.6}
        />
      ))}
    </svg>
  );
}

/**
 * The note, set like a short letter: the week as its heading, the coach's words in larger serif
 * type, and a sign-off where a signature would go. No bubbles, no avatar: it is a summary, not a
 * conversation.
 */
export function CoachLetter({
  week,
  status,
  narrative,
  writtenAt,
  writing,
  onWrite,
}: CoachLetterProps) {
  const body = paragraphs(narrative);
  const signedOn = new Date(writtenAt).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  });

  return (
    <article className="relative overflow-hidden rounded-[20px] border border-line bg-surface px-6 py-8 sm:px-10 sm:py-10">
      <Contours />
      <div className="relative flex flex-col gap-6">
        <h1 className="font-display text-[clamp(2.75rem,7vw,4.5rem)] leading-[0.92] font-extrabold text-balance">
          Your week{week ? `, ${weekLabel(week.start, week.end)}` : ''}
        </h1>

        {status === 'loading' && (
          <div
            role="status"
            aria-label="Your coach is reading your week"
            className="flex flex-col gap-3"
          >
            <p className="text-lg text-soft">Your coach is reading your week…</p>
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-11/12" />
            <Skeleton className="h-5 w-4/5" />
          </div>
        )}

        {status === 'GENERATED' && body.length === 0 && (
          <div className="flex flex-col items-start gap-3">
            <p className="text-lg text-soft">Your coach has no note for this week yet.</p>
            <Button variant="secondary" loading={writing} onClick={onWrite}>
              Write a note
            </Button>
          </div>
        )}

        {status === 'GENERATED' && body.length > 0 && (
          <>
            <div
              key={narrative}
              className={cn(
                'coach-letter flex flex-col gap-5 text-[1.1875rem] leading-[1.65] transition-opacity',
                writing && 'opacity-50',
              )}
            >
              {body.map((p, i) => (
                <p key={i} className="whitespace-pre-line">
                  {p}
                </p>
              ))}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
              <p className="text-[15px] text-muted">Written by your AI coach, {signedOn}</p>
              <span aria-live="polite" className="flex items-center gap-3">
                {writing && <span className="text-sm text-soft">Writing a new note…</span>}
                <Button
                  variant="ghost"
                  className="-ml-4 sm:ml-0"
                  disabled={writing}
                  onClick={onWrite}
                >
                  Write a new note
                </Button>
              </span>
            </div>
          </>
        )}

        {status === 'DISABLED' && (
          <p className="text-lg text-soft">AI coaching is off on this server.</p>
        )}

        {status === 'UNAVAILABLE' && (
          <div className="flex flex-col items-start gap-3">
            <p className="text-lg text-soft">
              Your coach couldn&apos;t write this week&apos;s note. Try again later.
            </p>
            <Button variant="secondary" loading={writing} onClick={onWrite}>
              Try again
            </Button>
          </div>
        )}
      </div>
    </article>
  );
}
