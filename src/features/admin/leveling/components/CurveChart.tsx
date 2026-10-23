import type { Threshold } from '@/features/activities/types';
import { formatNumber } from '@/lib/utils/format';

const W = 600;
const H = 220;
const PAD = { left: 52, right: 14, top: 14, bottom: 30 };

type CurveChartProps = {
  /** The ladder as it stands. */
  rows: readonly Threshold[];
  /** The ladder as it would be with the change being typed, drawn in the accent colour. */
  preview?: readonly Threshold[];
  /** The default curve is drawn dashed, as a reminder it is not stored. */
  dashed?: boolean;
};

/** XP needed per level as a line, so a jump or a dip in the curve is obvious before saving. */
export function CurveChart({ rows, preview, dashed = false }: CurveChartProps) {
  const all = [...rows, ...(preview ?? [])];
  if (all.length === 0) return null;
  const levels = all.map((r) => r.level);
  const minLevel = Math.min(...levels);
  const maxLevel = Math.max(...levels);
  const maxXp = Math.max(1, ...all.map((r) => r.xpRequired));
  const x = (level: number) =>
    PAD.left +
    (maxLevel === minLevel ? 0.5 : (level - minLevel) / (maxLevel - minLevel)) *
      (W - PAD.left - PAD.right);
  const y = (xp: number) => H - PAD.bottom - (xp / maxXp) * (H - PAD.top - PAD.bottom);
  const line = (list: readonly Threshold[]) =>
    list
      .map((r, i) => `${i === 0 ? 'M' : 'L'}${x(r.level).toFixed(1)} ${y(r.xpRequired).toFixed(1)}`)
      .join(' ');

  const first = rows[0];
  const last = rows[rows.length - 1];
  const label =
    first && last
      ? `XP needed by level, from level ${first.level} (${formatNumber(Math.round(first.xpRequired))} XP) to level ${last.level} (${formatNumber(Math.round(last.xpRequired))} XP)`
      : 'XP needed by level';

  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label} className="w-full">
      {[0, 0.5, 1].map((share) => {
        const gy = y(maxXp * share);
        return (
          <g key={share}>
            <line x1={PAD.left} x2={W - PAD.right} y1={gy} y2={gy} className="stroke-line" />
            <text x={PAD.left - 8} y={gy + 4} textAnchor="end" className="fill-muted text-[11px]">
              {formatNumber(Math.round(maxXp * share))}
            </text>
          </g>
        );
      })}
      <text
        x={x(minLevel)}
        y={H - 8}
        textAnchor={maxLevel === minLevel ? 'middle' : 'start'}
        className="fill-muted text-[11px]"
      >
        Level {minLevel}
      </text>
      {maxLevel !== minLevel && (
        <text x={x(maxLevel)} y={H - 8} textAnchor="end" className="fill-muted text-[11px]">
          Level {maxLevel}
        </text>
      )}

      <path
        d={line(rows)}
        fill="none"
        className="stroke-text"
        strokeWidth={2.5}
        strokeDasharray={dashed ? '6 5' : undefined}
        strokeLinejoin="round"
      />
      {rows.map((r) => (
        <circle key={r.level} cx={x(r.level)} cy={y(r.xpRequired)} r={3.5} className="fill-text" />
      ))}

      {preview && (
        <>
          <path
            d={line(preview)}
            fill="none"
            className="stroke-accent"
            strokeWidth={2.5}
            strokeLinejoin="round"
          />
          {preview
            .filter((p) => !rows.some((r) => r.level === p.level && r.xpRequired === p.xpRequired))
            .map((p) => (
              <circle
                key={p.level}
                cx={x(p.level)}
                cy={y(p.xpRequired)}
                r={6}
                className="fill-accent stroke-surface"
                strokeWidth={2}
              />
            ))}
        </>
      )}
    </svg>
  );
}
