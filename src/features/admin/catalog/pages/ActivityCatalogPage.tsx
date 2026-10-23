import { useMemo, useState } from 'react';
import { Plus, Shapes } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorPanel } from '@/components/ui/ErrorPanel';
import { SidePanel } from '@/components/ui/SidePanel';
import { Skeleton } from '@/components/ui/Skeleton';
import type { CatalogActivity } from '@/features/activities/types';
import { AdminPageHeader } from '../../components/AdminPageHeader';
import { useAdminCatalog } from '../api';
import { sortCatalog } from '../catalog';
import { ActivityPanel } from '../components/ActivityPanel';
import { CatalogTable } from '../components/CatalogTable';

/** `null` is closed, `'new'` a blank form, an activity its edit form. */
type Panel = null | 'new' | CatalogActivity;

/**
 * Everything users can log. It decides what the Log screen offers and what the "did you mean"
 * suggestions match. Deactivated activities stay here, hidden until "Show inactive" is on.
 */
export default function ActivityCatalogPage() {
  const catalog = useAdminCatalog();
  const [showInactive, setShowInactive] = useState(false);
  const [panel, setPanel] = useState<Panel>(null);

  const all = useMemo(() => sortCatalog(catalog.data ?? []), [catalog.data]);
  const visible = showInactive ? all : all.filter((a) => a.active);
  const inactive = all.length - all.filter((a) => a.active).length;

  return (
    <div>
      <AdminPageHeader
        title="Activity catalog"
        description={
          catalog.isSuccess
            ? `${visible.length} ${visible.length === 1 ? 'activity' : 'activities'}${
                inactive > 0 && !showInactive ? `, ${inactive} inactive hidden` : ''
              }.`
            : 'What users can log, and how much XP it earns.'
        }
        action={
          <Button onClick={() => setPanel('new')}>
            <Plus className="size-4" aria-hidden="true" />
            New activity
          </Button>
        }
      />

      <label className="mb-4 flex min-h-11 w-fit items-center gap-3">
        <input
          type="checkbox"
          className="size-5"
          checked={showInactive}
          onChange={(e) => setShowInactive(e.target.checked)}
        />
        Show inactive
      </label>

      {catalog.isPending ? (
        <div role="status" aria-label="Loading the catalog" className="flex flex-col gap-2">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-14" />
          ))}
        </div>
      ) : catalog.isError ? (
        <ErrorPanel
          error={catalog.error}
          title="Couldn't load the catalog"
          onRetry={() => void catalog.refetch()}
        />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={Shapes}
          title="No activities yet"
          description="Create the first one and users can start logging it."
        />
      ) : (
        <CatalogTable rows={visible} onEdit={(a) => setPanel(a)} />
      )}

      <SidePanel
        open={panel !== null}
        onClose={() => setPanel(null)}
        title={panel === 'new' || panel === null ? 'New activity' : `Edit ${panel.name}`}
      >
        {panel !== null && (
          <ActivityPanel
            // A fresh form for each activity, so its fields start from that row.
            key={panel === 'new' ? 'new' : panel.id}
            activity={panel === 'new' ? undefined : panel}
            rows={all}
            onDone={() => setPanel(null)}
          />
        )}
      </SidePanel>
    </div>
  );
}
