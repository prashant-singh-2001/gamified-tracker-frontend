import { useEffect, useId, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';

type SidePanelProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
};

/**
 * A panel that slides in from the right (full width on a phone) for the evidence or the form next
 * to a table. Built on a native modal <dialog>, so focus trapping, Esc and the backdrop come from
 * the browser; a click on the backdrop closes it.
 */
export function SidePanel({ open, onClose, title, children }: SidePanelProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal?.();
    if (!open && dialog.open) dialog.close?.();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      className="fixed inset-y-0 right-0 left-auto m-0 h-dvh max-h-none w-[min(100vw,30rem)] max-w-none flex-col border-l border-line-strong bg-surface p-0 text-text open:flex backdrop:bg-black/50"
    >
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-line px-5 py-3">
        <h2 id={titleId} className="font-display text-2xl leading-none font-extrabold">
          {title}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="grid size-11 place-items-center rounded-xl text-soft hover:text-text"
        >
          <X className="size-5" aria-hidden="true" />
        </button>
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-5 py-5">{children}</div>
    </dialog>
  );
}
