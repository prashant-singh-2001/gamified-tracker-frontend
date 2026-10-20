import { Outlet } from 'react-router';
import { FloatingNav } from './FloatingNav';
import { SideRail } from './SideRail';
import { TabBar } from './TabBar';

/**
 * Logged-in shell, in the survey-sheet theme (theme-survey.css); the admin console keeps the dark one. Floating nav bar on top everywhere; below 1024px a floating tab bar with a
 * raised Log button, from 1024px a left rail. Content spans the full width beside the rail
 * (32px padding, capped at 1760px on very wide screens) and is at least viewport-tall, so pages
 * like Home can stretch their last row to the bottom.
 */
export default function AppLayout() {
  return (
    <div className="theme-survey min-h-screen lg:grid lg:grid-cols-[15rem_1fr]">
      <SideRail />
      <div className="flex min-h-screen min-w-0 flex-col">
        <FloatingNav />
        <main className="mx-auto flex w-full max-w-[1760px] flex-1 flex-col px-4 pt-6 pb-32 sm:px-8 lg:pb-8">
          <Outlet />
        </main>
      </div>
      <TabBar />
    </div>
  );
}
