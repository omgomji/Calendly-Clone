'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import CreateMenuPopover from '@/components/CreateMenuPopover';

type SidebarProps = {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
};

export default function Sidebar({
  collapsed,
  onToggleCollapsed,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [createMenuOpen, setCreateMenuOpen] = useState(false);
  const [adminTemplatesOpen, setAdminTemplatesOpen] = useState(false);
  const [moreWaysOpen, setMoreWaysOpen] = useState(true);
  const [isDesktopViewport, setIsDesktopViewport] = useState(false);
  const createMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!createMenuOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setCreateMenuOpen(false);
    };

    const onPointerDown = (event: MouseEvent | PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (createMenuRef.current && !createMenuRef.current.contains(target)) {
        setCreateMenuOpen(false);
      }
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [createMenuOpen]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(min-width: 1024px)');
    const applyValue = (matches: boolean) => {
      setIsDesktopViewport(matches);
    };

    applyValue(mediaQuery.matches);
    const handleChange = (event: MediaQueryListEvent) => applyValue(event.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const navLinks = [
    { name: 'Scheduling', href: '/', icon: 'calendar_today' },
    { name: 'Meetings', href: '/meetings', icon: 'group' },
    { name: 'Availability', href: '/availability', icon: 'schedule' },
    { name: 'Contacts', href: '/contacts', icon: 'person_book' },
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const openEventTypeCreate = () => {
    setCreateMenuOpen(false);
    onCloseMobile();
    router.push('/');
    window.dispatchEvent(new CustomEvent('open-create-event'));
  };

  const openSingleUseLinks = () => {
    setCreateMenuOpen(false);
    onCloseMobile();
    router.push('/');
    window.dispatchEvent(new CustomEvent('open-single-use-links'));
  };

  const openMeetingPolls = () => {
    setCreateMenuOpen(false);
    onCloseMobile();
    router.push('/');
    window.dispatchEvent(new CustomEvent('open-meeting-polls'));
  };

  const sidebarCollapsed = isDesktopViewport ? collapsed : false;

  const sidebarStyle = {
    '--sidebar-width': `${sidebarCollapsed ? 88 : 230}px`,
  } as CSSProperties;

  return (
    <aside
      className={`fixed left-0 top-0 z-50 flex h-screen w-[280px] flex-col border-r border-slate-200 bg-white transition-transform duration-300 ease-out lg:w-[var(--sidebar-width)] ${
        mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}
      style={sidebarStyle}
    >
      <div className={sidebarCollapsed ? 'p-4 pb-2' : 'p-4 sm:p-6 sm:pb-2 pb-2'}>
        {/* Logo */}
        <div className="flex items-center gap-2 mb-6 cursor-pointer select-none">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white shrink-0">
            <span className="material-symbols-outlined text-xl font-bold">calendar_today</span>
          </div>
          {!sidebarCollapsed && (
            <span className="text-[22px] font-black tracking-tighter text-primary">CalClo</span>
          )}

          <button
            type="button"
            onClick={onCloseMobile}
            className="ml-auto inline-flex h-10 w-10 items-center justify-center rounded text-slate-500 hover:bg-slate-100 hover:text-slate-700 lg:hidden"
            aria-label="Close sidebar"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>

          <button
            type="button"
            onClick={onToggleCollapsed}
            className="ml-auto hidden rounded p-1 text-slate-400 transition-colors hover:text-slate-600 lg:inline-flex"
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <span className="material-symbols-outlined text-[20px]">
              {sidebarCollapsed ? 'keyboard_double_arrow_right' : 'keyboard_double_arrow_left'}
            </span>
          </button>
        </div>

        {/* Create Button */}
        <div className="relative mb-6" ref={createMenuRef}>
          <button
            type="button"
            onClick={() => setCreateMenuOpen((value) => !value)}
            className={
              sidebarCollapsed
                ? 'mx-auto flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-primary shadow-sm transition-colors hover:bg-slate-50 lg:h-10 lg:w-10'
                : 'w-full h-11 flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white text-primary font-bold text-[15px] hover:bg-slate-50 transition-colors shadow-sm'
            }
            aria-label="Create"
            aria-haspopup="menu"
            aria-expanded={createMenuOpen}
          >
            <span className="material-symbols-outlined text-xl font-bold">add</span>
            {!sidebarCollapsed && 'Create'}
          </button>

          {createMenuOpen ? (
            <div className={`absolute top-[calc(100%+8px)] z-50 ${sidebarCollapsed ? 'left-0' : 'left-0'}`}>
              <CreateMenuPopover
                variant="sidebar"
                onCreateEventType={openEventTypeCreate}
                onCreateSingleUseLink={openSingleUseLinks}
                onCreateMeetingPoll={openMeetingPolls}
                sidebarAdminTemplatesOpen={adminTemplatesOpen}
                setSidebarAdminTemplatesOpen={setAdminTemplatesOpen}
                sidebarMoreWaysOpen={moreWaysOpen}
                setSidebarMoreWaysOpen={setMoreWaysOpen}
              />
            </div>
          ) : null}
        </div>
      </div>

      {/* Navigation */}
      <nav className={sidebarCollapsed ? 'flex-1 overflow-y-auto px-1' : 'flex-1 overflow-y-auto px-2'}>
        {navLinks.map((link) => {
          const active = isActive(link.href);
          return (
            <Link
              key={link.name}
              href={link.href}
              onClick={onCloseMobile}
              className={
                sidebarCollapsed
                  ? `mb-1 flex min-h-11 flex-col items-center justify-center rounded-lg px-2 py-3 text-center text-[11px] font-bold leading-tight transition-all ${
                      active
                        ? 'bg-[var(--active-bg)] text-primary shadow-sm'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`
                  : `mb-1 flex min-h-11 items-center gap-3 rounded-lg px-4 py-3 text-[14px] font-bold transition-all ${
                      active
                        ? 'bg-[var(--active-bg)] text-primary shadow-sm'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`
              }
            >
              <span
                className={`material-symbols-outlined ${sidebarCollapsed ? 'text-[20px]' : 'text-[22px]'} ${
                  active ? 'text-primary' : 'text-slate-400'
                }`}
              >
                {link.icon}
              </span>
              <span className={sidebarCollapsed ? 'mt-1' : ''}>{link.name}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
