import { useEffect } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useToastStore, type ToastItem, type ToastKind } from './toastStore';

const DISMISS_MS = 4500;

const STYLES: Record<ToastKind, { icon: typeof Info; color: string }> = {
  success: { icon: CheckCircle2, color: 'text-accent' },
  error: { icon: AlertCircle, color: 'text-danger' },
  info: { icon: Info, color: 'text-rank' },
};

function ToastCard({ item }: { item: ToastItem }) {
  const dismiss = useToastStore((s) => s.dismiss);
  const { icon: Icon, color } = STYLES[item.kind];

  useEffect(() => {
    const timer = setTimeout(() => dismiss(item.id), DISMISS_MS);
    return () => clearTimeout(timer);
  }, [dismiss, item.id]);

  return (
    <div className="pointer-events-auto flex items-start gap-3 rounded-xl border border-line-strong bg-surface-2 p-3.5 shadow-lg">
      <Icon className={cn('mt-0.5 size-5 shrink-0', color)} aria-hidden="true" />
      <p className="flex-1 text-[15px]">{item.message}</p>
      <button
        type="button"
        onClick={() => dismiss(item.id)}
        aria-label="Dismiss notification"
        className="-m-2 grid size-11 place-items-center rounded-lg text-muted hover:text-text"
      >
        <X className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}

/** Mount once near the app root. */
export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-4 bottom-20 z-50 mx-auto flex max-w-sm flex-col gap-2 md:bottom-6 md:right-6 md:left-auto md:mx-0"
    >
      {toasts.map((t) => (
        <ToastCard key={t.id} item={t} />
      ))}
    </div>
  );
}
