import { cn } from '@/lib/utils/cn';
import { ProgressBar } from './ProgressBar';

type XpBarProps = {
  /** 0–100 */
  value: number;
  label: string;
  /** Right-hand figure, e.g. "340 / 500 XP". Set in JetBrains Mono. */
  detail?: string;
  className?: string;
};

/** Accent fill on a line track, with the figures in the mono face. */
export function XpBar({ value, label, detail, className }: XpBarProps) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex items-baseline justify-between gap-3 font-mono text-[13px]">
        <span className="font-bold tracking-widest text-text uppercase">{label}</span>
        {detail && <span className="text-muted">{detail}</span>}
      </div>
      <ProgressBar value={value} label={label} />
    </div>
  );
}
