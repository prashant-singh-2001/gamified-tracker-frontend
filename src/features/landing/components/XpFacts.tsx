import { CATEGORIES, CATEGORY_DEFAULT_MULTIPLIER, CATEGORY_LABEL } from '@/lib/api/types';
import { formatMultiplier } from '@/lib/utils/format';

const NOTES = [
  'An activity can override its category’s multiplier, so some entries are worth more or less than the base.',
  'Log on consecutive days and a streak multiplier applies on top.',
  'Very long or unusual sessions are held for review before their XP counts, which keeps the leaderboard fair.',
];

/** The real category multipliers, then the three rules that change what a session is worth. */
export function XpFacts() {
  const ordered = [...CATEGORIES].sort(
    (a, b) => CATEGORY_DEFAULT_MULTIPLIER[b] - CATEGORY_DEFAULT_MULTIPLIER[a],
  );
  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] lg:gap-20">
      <table className="w-full border-collapse text-left">
        <caption className="sr-only">Base XP multiplier for each activity category</caption>
        <thead className="sr-only">
          <tr>
            <th scope="col">Category</th>
            <th scope="col">Base multiplier</th>
          </tr>
        </thead>
        <tbody>
          {ordered.map((category) => (
            <tr key={category} className="border-b border-line-strong">
              <th scope="row" className="py-2.5 text-lg font-normal">
                {CATEGORY_LABEL[category]}
              </th>
              <td className="py-2.5 text-right font-display text-4xl leading-none font-bold">
                {formatMultiplier(CATEGORY_DEFAULT_MULTIPLIER[category])}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex max-w-[34rem] flex-col gap-5 text-lg leading-relaxed text-soft">
        {NOTES.map((note) => (
          <p key={note}>{note}</p>
        ))}
      </div>
    </div>
  );
}
