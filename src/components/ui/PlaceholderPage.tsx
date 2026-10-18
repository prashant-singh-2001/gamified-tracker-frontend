import { Card } from './Card';

type PlaceholderPageProps = {
  title: string;
  /** Screen number from etram-screens.md. */
  screen: number;
  /** Endpoints this screen will use once it is built. */
  endpoints?: readonly string[];
};

/** Stand-in for a screen that is routed but not built yet. */
export function PlaceholderPage({ title, screen, endpoints = [] }: PlaceholderPageProps) {
  return (
    <section className="flex flex-col gap-4">
      <p className="font-mono text-xs font-bold tracking-widest text-muted uppercase">
        Screen {screen}
      </p>
      <h1 className="font-display text-3xl font-extrabold tracking-tight">{title}</h1>
      <Card>
        <p className="text-soft">This screen is routed and waiting to be built.</p>
        {endpoints.length > 0 && (
          <ul className="mt-3 flex flex-col gap-1 font-mono text-sm text-muted">
            {endpoints.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        )}
      </Card>
    </section>
  );
}
