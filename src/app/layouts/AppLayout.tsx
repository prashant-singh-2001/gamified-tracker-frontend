import { Outlet } from 'react-router';
import { FloatingNav } from './FloatingNav';
import { SideRail } from './SideRail';
import { TabBar } from './TabBar';

/**
 * Logged-in shell. Floating nav bar on top everywhere; below 1024px a floating tab bar with a
 * raised Log button, from 1024px a left rail.
 */
export default function AppLayout() {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[15rem_1fr]">
      <SideRail />
      <div className="flex min-w-0 flex-col">
        <FloatingNav />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-6 pb-32 lg:px-8 lg:pb-10">
          <Outlet />
        </main>
      </div>
      <TabBar />
    </div>
  );
}
