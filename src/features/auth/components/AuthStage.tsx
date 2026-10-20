import type { ReactNode } from 'react';
import { AuthMap } from './AuthMap';
import type { Face } from './FlipCard';

type AuthStageProps = {
  /** Which face the map marker follows: Basecamp for the back, partway up for the front. */
  face: Face;
  /** The line beside the map (from 1280px). Pass a `key` to fade it in again when it changes. */
  caption?: ReactNode;
  children: ReactNode;
};

/** Everything behind and beside the sign-in card: the route map, the card slot and the caption. */
export function AuthStage({ face, caption, children }: AuthStageProps) {
  return (
    <div className="relative isolate flex min-h-[calc(100dvh-12rem)] items-center overflow-hidden">
      {/* Behind the card on small screens; beside it from 1280px, where the caption joins it. */}
      <div
        aria-hidden="true"
        className="map-fade pointer-events-none absolute inset-0 -z-10 opacity-40 xl:inset-y-0 xl:right-0 xl:left-auto xl:w-[62%] xl:opacity-100"
      >
        <AuthMap face={face} />
      </div>

      <div className="mx-auto flex w-full max-w-[1240px] justify-center px-4 py-8 xl:justify-start xl:px-6">
        {children}
      </div>

      {caption}
    </div>
  );
}
