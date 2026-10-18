import { useEffect, useRef, type ReactNode } from 'react';

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
};

/** Native <dialog>: focus trap, Esc to close and a backdrop come from the browser. */
export function Modal({ open, onClose, title, children }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal?.();
    if (!open && dialog.open) dialog.close?.();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby="modal-title"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      className="m-auto w-[min(92vw,28rem)] rounded-2xl border border-line-strong bg-surface p-6 text-text backdrop:bg-black/60"
    >
      <h2 id="modal-title" className="mb-3 font-display text-xl font-bold">
        {title}
      </h2>
      {children}
    </dialog>
  );
}
