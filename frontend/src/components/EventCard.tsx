'use client';

import { useEffect, useRef, useState } from 'react';

interface EventCardProps {
  id: number;
  title: string;
  slug: string;
  duration: number;
  description?: string | null;
  bookingUrl?: string;
  publicUsername?: string;
  isActive: boolean;
  onDelete: (id: number) => void;
  onEdit: (event: { id: number; title: string; slug: string; duration: number; description?: string | null }) => void;
  onBookMeeting: (event: { id: number; title: string; slug: string; duration: number; description?: string | null; bookingUrl?: string }) => void;
  onCreateSingleUseLink: (event: { id: number; title: string; slug: string; duration: number; description?: string | null; bookingUrl?: string }) => void;
  onDuplicate: (event: { id: number; title: string; slug: string; duration: number; description?: string | null; bookingUrl?: string }) => void;
  onToggleActive: (event: { id: number; title: string; slug: string; duration: number; description?: string | null; bookingUrl?: string }, nextValue: boolean) => void | Promise<void>;
  onSelect?: (event: { id: number; title: string; slug: string; duration: number; description?: string | null }) => void;
  onToggleSelect?: (event: { id: number; title: string; slug: string; duration: number; description?: string | null }) => void;
  selected?: boolean;
}

export default function EventCard({
  id,
  title,
  slug,
  duration,
  description,
  bookingUrl,
  publicUsername,
  isActive,
  onDelete,
  onEdit,
  onBookMeeting,
  onCreateSingleUseLink,
  onDuplicate,
  onToggleActive,
  onSelect,
  onToggleSelect,
  selected = false,
}: EventCardProps) {
  const [copied, setCopied] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [active, setActive] = useState(isActive);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const eventPayload = { id, title, slug, duration, description, bookingUrl };

  // Resolve the public booking page URL
  const getPublicUrl = () => {
    if (bookingUrl && bookingUrl.startsWith('http')) return bookingUrl;
    if (bookingUrl) return `${window.location.origin}${bookingUrl}`;
    if (publicUsername) return `${window.location.origin}/${publicUsername}/${slug}`;
    return null;
  };

  const openBookingPage = () => {
    const url = getPublicUrl();
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      onBookMeeting(eventPayload);
    }
  };

  const copyLink = async () => {
    const url = getPublicUrl() ?? `${window.location.origin}/${slug}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  useEffect(() => {
    setActive(isActive);
  }, [isActive]);

  useEffect(() => {
    if (!menuOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };

    const onPointerDown = (e: MouseEvent | PointerEvent) => {
      const target = e.target as Node | null;
      if (!target) return;
      if (menuRef.current && !menuRef.current.contains(target)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [menuOpen]);

  return (
    <div
      className={`group relative overflow-visible rounded-xl border bg-white ${
        selected ? 'border-primary shadow-[0_0_0_1px_rgba(0,107,255,0.2)]' : 'border-slate-200'
      }`}
      onClick={() => onSelect?.(eventPayload)}
    >
      <div className="absolute left-0 top-0 h-full w-1 bg-primary" aria-hidden="true" />

      <div className="flex flex-wrap items-center gap-3 px-4 py-4 sm:gap-4 sm:px-5">
        <input
          type="checkbox"
          aria-label={`Select ${title}`}
          checked={selected}
          onChange={() => (onToggleSelect ? onToggleSelect(eventPayload) : onSelect?.(eventPayload))}
          onClick={(e) => e.stopPropagation()}
          className="h-5 w-5 cursor-pointer rounded border-slate-300 text-primary"
        />

        <div className="min-w-0 flex-1">
          <button
            type="button"
            onClick={() => onEdit(eventPayload)}
            className="block max-w-full truncate text-left text-[14px] font-bold text-slate-900 group-hover:text-primary"
            title={title}
          >
            {title}
          </button>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-[13px] font-medium text-slate-500">
            <span>{duration} min</span>
            <span className="text-slate-300">•</span>
            <span>Google Meet</span>
            <span className="text-slate-300">•</span>
            <span>One-on-One</span>
          </div>
        </div>

        <div className="hidden w-56 shrink-0 md:block">
          <p className="text-[13px] font-medium text-slate-500">Weekdays, 9 am - 5 pm</p>
        </div>

        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
          <div className="flex items-center gap-2 md:pointer-events-none md:opacity-0 md:transition-opacity md:group-hover:pointer-events-auto md:group-hover:opacity-100 md:group-focus-within:pointer-events-auto md:group-focus-within:opacity-100">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onBookMeeting(eventPayload);
              }}
              title="Book meeting"
              aria-label="Book meeting"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 sm:h-9 sm:w-9"
            >
              <span className="material-symbols-outlined text-[18px]">calendar_add_on</span>
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onCreateSingleUseLink(eventPayload);
              }}
              title="Create single-use link"
              aria-label="Create single-use link"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 sm:h-9 sm:w-9"
            >
              <span className="material-symbols-outlined text-[18px]">switch_access_shortcut</span>
            </button>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              void copyLink();
            }}
            className="inline-flex h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-3 text-[13px] font-bold text-slate-800 hover:bg-slate-50 sm:h-9 sm:px-4"
          >
            <span className="material-symbols-outlined rotate-[135deg] text-[16px] text-slate-500">link</span>
            <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy link'}</span>
            <span className="sm:hidden">{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              openBookingPage();
            }}
            title="Open booking page"
            aria-label="Open booking page"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 sm:h-9 sm:w-9"
          >
            <span className="material-symbols-outlined text-[18px]">open_in_new</span>
          </button>

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              aria-label="More actions"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen((v) => !v);
              }}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 sm:h-9 sm:w-9"
            >
              <span className="material-symbols-outlined text-[20px]">more_vert</span>
            </button>

            {menuOpen && (
              <div
                role="menu"
                aria-label="Event type actions"
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 top-full z-50 mt-2 w-[min(250px,90vw)] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg"
              >
                <button
                  type="button"
                  role="menuitem"
                  className="flex w-full items-center gap-3 px-4 py-3 text-left text-[14px] font-medium text-slate-900 hover:bg-slate-50 sm:py-2.5"
                  onClick={() => {
                    setMenuOpen(false);
                    onBookMeeting(eventPayload);
                  }}
                >
                  <span className="material-symbols-outlined text-[18px] text-slate-600">open_in_new</span>
                  View booking page
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className="flex w-full items-center gap-3 px-4 py-3 text-left text-[14px] font-medium text-slate-900 hover:bg-slate-50 sm:py-2.5"
                  onClick={() => {
                    setMenuOpen(false);
                    onEdit(eventPayload);
                  }}
                >
                  <span className="material-symbols-outlined text-[18px] text-slate-600">edit</span>
                  Edit
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className="flex w-full items-center gap-3 px-4 py-3 text-left text-[14px] font-medium text-slate-900 hover:bg-slate-50 sm:py-2.5"
                  onClick={() => setMenuOpen(false)}
                >
                  <span className="material-symbols-outlined text-[18px] text-slate-600">person</span>
                  Edit permissions
                </button>

                <div className="my-1 h-px bg-slate-200" />

                <button
                  type="button"
                  role="menuitem"
                  className="flex w-full items-center gap-3 px-4 py-3 text-left text-[14px] font-medium text-slate-900 hover:bg-slate-50 sm:py-2.5"
                  onClick={() => setMenuOpen(false)}
                >
                  <span className="material-symbols-outlined text-[18px] text-slate-600">web</span>
                  Add to website
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className="flex w-full items-center gap-3 px-4 py-3 text-left text-[14px] font-medium text-slate-900 hover:bg-slate-50 sm:py-2.5"
                  onClick={() => setMenuOpen(false)}
                >
                  <span className="material-symbols-outlined text-[18px] text-slate-600">note_add</span>
                  Add internal note
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-slate-50 sm:py-2.5"
                  onClick={() => setMenuOpen(false)}
                >
                  <span className="material-symbols-outlined mt-0.5 text-[18px] text-slate-600">language</span>
                  <span className="leading-tight">
                    <span className="block text-[14px] font-medium text-slate-900">Change invitee language</span>
                    <span className="block text-[12px] text-slate-600">English</span>
                  </span>
                </button>

                <div className="my-1 h-px bg-slate-200" />

                <button
                  type="button"
                  role="menuitem"
                  className="flex w-full items-center gap-3 px-4 py-3 text-left text-[14px] font-medium text-slate-900 hover:bg-slate-50 sm:py-2.5"
                  onClick={() => setMenuOpen(false)}
                >
                  <span className="material-symbols-outlined text-[18px] text-slate-600">visibility_off</span>
                  Make secret
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className="flex w-full items-center gap-3 px-4 py-3 text-left text-[14px] font-medium text-slate-900 hover:bg-slate-50 sm:py-2.5"
                  onClick={() => {
                    setMenuOpen(false);
                    onDuplicate(eventPayload);
                  }}
                >
                  <span className="material-symbols-outlined text-[18px] text-slate-600">content_copy</span>
                  Duplicate
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className="flex w-full items-center gap-3 px-4 py-3 text-left text-[14px] font-medium text-red-600 hover:bg-red-50 sm:py-2.5"
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete(id);
                  }}
                >
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                  Delete
                </button>

                <div className="my-1 h-px bg-slate-200" />

                <div className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-[14px] font-medium text-slate-900">On/Off</span>
                  <button
                    type="button"
                    aria-label="Toggle event active status"
                    aria-pressed={active}
                    onClick={async (e) => {
                      e.stopPropagation();
                      const nextValue = !active;
                      setActive(nextValue);
                      await onToggleActive(eventPayload, nextValue);
                    }}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                      active ? 'bg-primary' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        active ? 'translate-x-4' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
