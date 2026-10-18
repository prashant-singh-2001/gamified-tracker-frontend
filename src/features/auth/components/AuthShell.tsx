import type { ReactNode } from 'react';
import { Card } from '@/components/ui/Card';

type AuthShellProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
};

export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-10 sm:py-16">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-3xl font-extrabold tracking-tight">{title}</h1>
        <p className="text-soft">{subtitle}</p>
      </div>
      <Card className="flex flex-col gap-5 p-6">{children}</Card>
      <p className="text-center text-soft">{footer}</p>
    </div>
  );
}
