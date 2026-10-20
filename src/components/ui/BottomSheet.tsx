import {
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';
import { GripHorizontal } from 'lucide-react';

type BottomSheetProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
};

type Snap = 60 | 92;
const CLOSE_DRAG = 120; // px dragged down before the sheet dismisses
const SNAP_DRAG = 40; // px of travel needed to change snap point

/**
 * Phone: a bottom sheet with a drag handle that snaps to 60% / 92% of the screen height and
 * closes when dragged far enough down. Desktop (≥1024px): a centred modal.
 * Built on native <dialog>, so focus trapping, Esc and the backdrop come from the browser.
 */
export function BottomSheet({ open, onClose, title, children }: BottomSheetProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [snap, setSnap] = useState<Snap>(60);
  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef<number | null>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal?.();
    if (!open && dialog.open) dialog.close?.();
  }, [open]);

  function handleClose() {
    setSnap(60); // every opening starts at the lower snap point
    onClose();
  }

  function onPointerDown(e: ReactPointerEvent<HTMLButtonElement>) {
    dragStart.current = e.clientY;
    setDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: ReactPointerEvent<HTMLButtonElement>) {
    if (dragStart.current === null) return;
    setDragY(e.clientY - dragStart.current);
  }

  function onPointerUp() {
    if (dragStart.current === null) return;
    const dy = dragY;
    dragStart.current = null;
    setDragging(false);
    setDragY(0);
    if (dy > CLOSE_DRAG && snap === 60) handleClose();
    else if (dy > SNAP_DRAG) setSnap(60);
    else if (dy < -SNAP_DRAG) setSnap(92);
  }

  const style = {
    '--sheet-h': `${snap}dvh`,
    transform: dragY > 0 ? `translateY(${dragY}px)` : undefined,
    transition: dragging ? 'none' : 'height 200ms ease-out, transform 200ms ease-out',
  } as CSSProperties;

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={handleClose}
      onClick={(e) => {
        if (e.target === ref.current) handleClose();
      }}
      style={style}
      className="sheet fixed inset-x-0 top-auto bottom-0 m-0 h-[var(--sheet-h)] max-h-none w-full max-w-none flex-col rounded-t-[20px] border border-line-strong bg-surface p-0 text-text open:flex backdrop:bg-black/60 lg:inset-0 lg:m-auto lg:h-fit lg:max-h-[90dvh] lg:w-[min(92vw,34rem)] lg:rounded-[20px]"
    >
      <button
        type="button"
        aria-label="Drag to resize or close"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className="grid h-11 w-full shrink-0 touch-none place-items-center text-faint lg:hidden"
      >
        <GripHorizontal className="size-6" aria-hidden="true" />
      </button>
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 pt-0 pb-6 lg:pt-5">
        <h2 id={titleId} className="font-display text-3xl leading-none font-extrabold">
          {title}
        </h2>
        {children}
      </div>
    </dialog>
  );
}
