'use client';

import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { useTheme } from '@/components/ThemeProvider';

type TopBarProps = {
  sidebarWidth: number;
  onMobileMenuToggle: () => void;
};

export default function TopBar({ sidebarWidth, onMobileMenuToggle }: TopBarProps) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const profileButtonRef = useRef<HTMLButtonElement | null>(null);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const { theme, setTheme } = useTheme();

  const headerStyle = {
    '--sidebar-width': `${sidebarWidth}px`,
  } as CSSProperties;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setProfileOpen(false);
    };

    const onMouseDown = (event: MouseEvent) => {
      if (!profileOpen) return;
      const target = event.target as Node;
      if (profileMenuRef.current?.contains(target)) return;
      if (profileButtonRef.current?.contains(target)) return;
      setProfileOpen(false);
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('mousedown', onMouseDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('mousedown', onMouseDown);
    };
  }, [profileOpen]);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  const handleCopyLink = () => {
    const adminLink = `${window.location.origin}/om`;
    navigator.clipboard.writeText(adminLink);
    setCopied(true);
  };

  return (
    <header
      className="fixed top-0 right-0 left-0 z-40 h-14 border-b border-transparent bg-white lg:left-[var(--sidebar-width)]"
      style={headerStyle}
    >
      <div className="flex h-full w-full items-center justify-between px-3 sm:px-4 lg:px-8">
        <div className="flex items-center">
          <button
            type="button"
            onClick={onMobileMenuToggle}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full text-slate-600 transition-colors hover:bg-slate-50 lg:hidden"
            aria-label="Open navigation"
          >
            <span className="material-symbols-outlined text-[22px]">menu</span>
          </button>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <div className="relative">
            <button
              ref={profileButtonRef}
              type="button"
              onClick={() => setProfileOpen((v) => !v)}
              className="group flex min-h-11 cursor-pointer items-center gap-1 rounded-full border border-transparent p-1 pr-1.5 transition-colors hover:bg-slate-50 sm:min-h-0 sm:pr-2"
              aria-haspopup="menu"
              aria-expanded={profileOpen}
            >
              <div className="h-9 w-9 overflow-hidden rounded-full border border-slate-200 bg-slate-100 text-[11px] font-bold text-slate-600 flex items-center justify-center sm:h-8 sm:w-8">
                O
              </div>
              <span className="material-symbols-outlined text-slate-400 text-sm">arrow_drop_down</span>
            </button>

            {profileOpen && (
              <div
                ref={profileMenuRef}
                role="menu"
                className="absolute right-0 mt-2 w-[min(280px,calc(100vw-1rem))] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg"
              >
                <div className="p-4">
                  <div className="text-[15px] font-bold text-slate-900">OM</div>
                </div>

                <div className="h-px bg-slate-100" />

                <div className="p-3">
                  <div className="px-2 py-2 text-[12px] font-bold text-slate-500">Account settings</div>
                  {[
                    { label: 'Profile', icon: 'person', action: () => {} },
                    { label: 'My Link', icon: 'link', action: handleCopyLink },
                    { label: `Theme: ${theme === 'dark' ? 'Dark' : 'Light'}`, icon: theme === 'dark' ? 'dark_mode' : 'light_mode', action: (e: React.MouseEvent) => {
                      e.stopPropagation();
                      setTheme(theme === 'dark' ? 'light' : 'dark');
                    } },
                  ].map((item) => (
                    <button
                      key={item.label}
                      role="menuitem"
                      onClick={item.action}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-50 text-[14px] font-bold text-slate-800 justify-between"
                    >
                      <span className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-[20px] text-slate-500">{item.icon}</span>
                        {item.label}
                      </span>
                      {item.label === 'My Link' && copied && (
                        <span className="text-[12px] font-semibold text-green-600">Copied!</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
