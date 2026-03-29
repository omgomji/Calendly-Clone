'use client';

import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';

const SIDEBAR_EXPANDED_WIDTH = 230;
const SIDEBAR_COLLAPSED_WIDTH = 88;

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(min-width: 1024px)');
    const handleBreakpoint = (event: MediaQueryListEvent) => {
      if (event.matches) {
        setMobileSidebarOpen(false);
      }
    };

    mediaQuery.addEventListener('change', handleBreakpoint);
    return () => mediaQuery.removeEventListener('change', handleBreakpoint);
  }, []);

  const sidebarWidth = useMemo(
    () => (sidebarCollapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_EXPANDED_WIDTH),
    [sidebarCollapsed],
  );

  const sidebarDesktopStyle = {
    '--sidebar-width': `${sidebarWidth}px`,
  } as CSSProperties;

  return (
    <div className="cal-ui-shell flex min-h-screen bg-surface selection:bg-primary/10">
      {mobileSidebarOpen ? (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/35 lg:hidden"
        />
      ) : null}

      <Sidebar
        collapsed={sidebarCollapsed}
        onToggleCollapsed={() => setSidebarCollapsed((prev) => !prev)}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <TopBar
          sidebarWidth={sidebarWidth}
          onMobileMenuToggle={() => setMobileSidebarOpen((prev) => !prev)}
        />
        <main
          className="flex-1 mt-14 overflow-y-auto bg-white p-4 sm:p-6 lg:p-10 lg:ml-[var(--sidebar-width)]"
          style={sidebarDesktopStyle}
        >
          <div className="w-full max-w-5xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
