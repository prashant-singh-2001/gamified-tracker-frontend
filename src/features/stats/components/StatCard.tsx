import type { ReactNode } from 'react';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils/cn';

type StatCardProps = {
  /** The question the card answers, as its heading. */
  question: string;
  /** The answer, big: a number with its unit or a short phrase. */
  answer: ReactNode;
  /** One sentence of context under the answer. */
  context?: ReactNode;
  /** Extra controls on the right of the heading, e.g. range choices. */
  aside?: ReactNode;
  /** Line above the chart that follows hover, focus and taps on its marks. */
  readout?: string;
  children: ReactNode;
  className?: string;
};

/** One card of the Stats screen: question, answer, readout, chart. */
export function StatCard({
  question,
  answer,
  context,
  aside,
  readout,
  children,
  className,
}: StatCardProps) {
  return (
    <Card className={cn('flex flex-col gap-4', className)}>
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <h2 className="font-display text-2xl leading-none font-extrabold">{question}</h2>
        {aside}
      </div>
      <div>
        <p className="font-display text-5xl leading-none font-extrabold">{answer}</p>
        {context && <p className="mt-1 text-soft">{context}</p>}
      </div>
      {readout !== undefined && (
        <p className="min-h-6 font-mono text-[15px] text-text" aria-live="polite">
          {readout}
        </p>
      )}
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </Card>
  );
}
