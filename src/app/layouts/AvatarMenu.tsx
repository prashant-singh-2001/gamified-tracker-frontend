import { useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router';
import { LogOut, ShieldCheck, User } from 'lucide-react';
import { useLogout } from '@/features/auth/api';
import { useAuthStore } from '@/lib/auth/authStore';

const itemClass =
  'flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-[15px] font-medium text-soft no-underline hover:bg-surface-2 hover:text-text';

export function AvatarMenu() {
  const [open, setOpen] = useState(false);
  const wrapper = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const isAdmin = useAuthStore((s) => s.user?.role === 'ADMIN');
  const logout = useLogout();

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!wrapper.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div ref={wrapper} className="relative">
      <button
        type="button"
        aria-label="Account menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((o) => !o)}
        className="grid size-11 place-items-center rounded-full border border-line-strong text-soft hover:text-text"
      >
        <User className="size-5" aria-hidden="true" />
      </button>
      {open && (
        <div
          id={menuId}
          className="absolute top-full right-0 mt-2 w-48 rounded-2xl border border-line-strong bg-surface p-1.5 shadow-lg"
        >
          {isAdmin && (
            <Link to="/admin" onClick={() => setOpen(false)} className={itemClass}>
              <ShieldCheck className="size-5" aria-hidden="true" />
              Admin console
            </Link>
          )}
          <button type="button" onClick={logout} className={itemClass}>
            <LogOut className="size-5" aria-hidden="true" />
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
