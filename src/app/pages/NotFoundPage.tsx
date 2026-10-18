import { Link } from 'react-router';
import { Compass } from 'lucide-react';
import { buttonClass } from '@/components/ui/buttonStyles';
import { EmptyState } from '@/components/ui/EmptyState';

export default function NotFoundPage() {
  return (
    <div className="mx-auto max-w-xl px-6 py-12">
      <EmptyState
        icon={Compass}
        title="404 — Off the trail"
        description="That page doesn't exist or has moved."
        action={
          <Link to="/" className={buttonClass('primary')}>
            Back to start
          </Link>
        }
      />
    </div>
  );
}
