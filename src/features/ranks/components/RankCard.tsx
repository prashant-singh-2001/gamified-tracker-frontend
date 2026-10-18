import { Mountain } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { getTierInfo, type RankCard as RankCardData } from '@/lib/api/types';
import { formatNumber, formatTopPercent, formatXp } from '@/lib/utils/format';

export function RankCard({ rank }: { rank: RankCardData }) {
  const tier = getTierInfo(rank.tier);

  return (
    <Card className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Mountain className="size-7 text-rank" aria-hidden="true" />
          <div>
            <p className="font-mono text-xs font-bold tracking-widest text-muted uppercase">
              Your rank
            </p>
            <h2 className="font-display text-2xl font-extrabold text-rank">{tier.label}</h2>
          </div>
        </div>
        <Badge tone="rank">{formatTopPercent(rank.position, rank.totalUsers)}</Badge>
      </div>

      <dl className="grid grid-cols-3 gap-4">
        <div>
          <dt className="text-sm text-muted">Level</dt>
          <dd className="font-mono text-xl font-bold">{rank.overallLevel}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted">Total XP</dt>
          <dd className="font-mono text-xl font-bold text-xp">{formatXp(rank.totalXp)}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted">Position</dt>
          <dd className="font-mono text-xl font-bold">
            #{formatNumber(rank.position)}
            <span className="text-sm font-medium text-muted">
              {' '}
              / {formatNumber(rank.totalUsers)}
            </span>
          </dd>
        </div>
      </dl>
    </Card>
  );
}
