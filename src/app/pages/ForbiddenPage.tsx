import { Link } from 'react-router';
import { ShieldAlert } from 'lucide-react';
import { buttonClass } from '@/components/ui/buttonStyles';
import { EmptyState } from '@/components/ui/EmptyState';

export default function ForbiddenPage() {
  return (
    <div className="mx-auto max-w-xl p-6">
      <EmptyState
        icon={ShieldAlert}
        title="403 — Admins only"
        description="Your account doesn't have access to this area."
        action={
          <Link to="/app" className={buttonClass('secondary')}>
            Back to your dashboard
          </Link>
        }
      />
    </div>
  );
}
