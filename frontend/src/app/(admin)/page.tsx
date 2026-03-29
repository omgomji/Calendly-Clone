'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { getEventTypes, deleteEventType, createEventType, updateEventType, getPublicProfile } from '@/lib/api';
import type { EventType, EventTypePayload } from '@/types/event-types';
import EventCard from '@/components/EventCard';
import EventDrawer from '@/components/EventDrawer';
import SingleUseLinkDrawer from '@/components/SingleUseLinkDrawer';
import MeetingPollDrawer from '@/components/MeetingPollDrawer';
import CreateMenuPopover from '@/components/CreateMenuPopover';
import Link from 'next/link';

type EventTypeUpsert = EventTypePayload;

export default function Dashboard() {
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventDrawerOpen, setEventDrawerOpen] = useState(false);
  const [singleUseLinkDrawerOpen, setSingleUseLinkDrawerOpen] = useState(false);
  const [meetingPollDrawerOpen, setMeetingPollDrawerOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventType | null>(null);
  const [activeTab, setActiveTab] = useState('Event types');
  const [createMenuOpen, setCreateMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEventIds, setSelectedEventIds] = useState<number[]>([]);
  const [bulkToggleMenuOpen, setBulkToggleMenuOpen] = useState(false);
  const [adminTemplatesOpen, setAdminTemplatesOpen] = useState(false);
  const [moreWaysOpen, setMoreWaysOpen] = useState(true);
  const [publicUsername, setPublicUsername] = useState<string | null>(null);
  const createMenuRef = useRef<HTMLDivElement | null>(null);
  const bulkToggleRef = useRef<HTMLDivElement | null>(null);

  const tabs = ['Event types', 'Single-use links', 'Meeting polls'];

  const searchPlaceholder = useMemo(() => {
    if (activeTab === 'Meeting polls') return 'Search meeting polls';
    if (activeTab === 'Single-use links') return 'Search single-use links';
    return 'Search event types...';
  }, [activeTab]);

  useEffect(() => {
    fetchEventTypes();
    fetchPublicUsername();

    const handleOpenCreate = () => {
      setEditingEvent(null);
      setEventDrawerOpen(true);
    };

    const handleOpenSingleUseLinks = () => {
      setActiveTab('Single-use links');
      setSingleUseLinkDrawerOpen(true);
      setCreateMenuOpen(false);
    };

    const handleOpenMeetingPolls = () => {
      setActiveTab('Meeting polls');
      setMeetingPollDrawerOpen(true);
      setCreateMenuOpen(false);
    };

    window.addEventListener('open-create-event', handleOpenCreate);
    window.addEventListener('open-single-use-links', handleOpenSingleUseLinks);
    window.addEventListener('open-meeting-polls', handleOpenMeetingPolls);

    return () => {
      window.removeEventListener('open-create-event', handleOpenCreate);
      window.removeEventListener('open-single-use-links', handleOpenSingleUseLinks);
      window.removeEventListener('open-meeting-polls', handleOpenMeetingPolls);
    };
  }, []);

  useEffect(() => {
    if (!createMenuOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setCreateMenuOpen(false);
    };

    const onPointerDown = (e: MouseEvent | PointerEvent) => {
      const target = e.target as Node | null;
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
    if (!bulkToggleMenuOpen) return;

    const onPointerDown = (e: MouseEvent | PointerEvent) => {
      const target = e.target as Node | null;
      if (!target) return;
      if (bulkToggleRef.current && !bulkToggleRef.current.contains(target)) {
        setBulkToggleMenuOpen(false);
      }
    };

    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [bulkToggleMenuOpen]);

  const fetchEventTypes = async () => {
    try {
      setLoading(true);
      const data = await getEventTypes();
      setEventTypes(data);
    } catch (error) {
      console.error('Error fetching event types:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPublicUsername = async () => {
    // The backend uses a single seeded user; use 'admin' as the default username
    // then verify by querying the public profile. Fallback to process.env or 'admin'.
    const defaultUsername = process.env.NEXT_PUBLIC_USERNAME || 'om';
    try {
      const profile = await getPublicProfile(defaultUsername);
      setPublicUsername(profile.user.username || defaultUsername);
    } catch {
      setPublicUsername(defaultUsername);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this event type?')) {
      try {
        await deleteEventType(id);
        fetchEventTypes();
      } catch (error) {
        console.error('Error deleting event type:', error);
      }
    }
  };

  const handleToggleSelection = (event: EventType) => {
    setSelectedEventIds((prev) =>
      prev.includes(event.id) ? prev.filter((id) => id !== event.id) : [...prev, event.id]
    );
  };

  const handleBulkDelete = async () => {
    if (selectedEventIds.length === 0) return;
    const confirmed = confirm(`Delete ${selectedEventIds.length} selected event type(s)?`);
    if (!confirmed) return;

    try {
      await Promise.all(selectedEventIds.map((id) => deleteEventType(id)));
      setSelectedEventIds([]);
      await fetchEventTypes();
    } catch (error) {
      console.error('Error deleting selected event types:', error);
      alert('Failed to delete one or more selected event types.');
    }
  };

  const handleBulkToggleActive = async (nextValue: boolean) => {
    const selectedEvents = eventTypes.filter((event) => selectedEventIds.includes(event.id));
    if (selectedEvents.length === 0) return;

    try {
      await Promise.all(
        selectedEvents.map((event) =>
          updateEventType(event.id, {
            title: event.title,
            slug: event.slug,
            duration: event.duration,
            description: event.description || '',
            isActive: nextValue,
          })
        )
      );
      setBulkToggleMenuOpen(false);
      await fetchEventTypes();
    } catch (error) {
      console.error('Error toggling selected event types:', error);
      alert('Failed to update one or more selected event types.');
    }
  };

  const handleEdit = (event: EventType) => {
    setEditingEvent(event);
    setEventDrawerOpen(true);
  };

  const handleBookMeeting = (event: EventType) => {
    // Build the actual public booking URL using the known public username
    const username = publicUsername || 'om';
    const url = event.bookingUrl || `${window.location.origin}/${username}/${event.slug}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleCreateSingleUseLink = () => {
    setActiveTab('Single-use links');
    setSingleUseLinkDrawerOpen(true);
  };

  const handleDuplicate = async (event: EventType) => {
    const existingSlugs = new Set(eventTypes.map((e) => e.slug));
    const baseSlug = `${event.slug}-copy`;
    let nextSlug = baseSlug;
    let n = 2;

    while (existingSlugs.has(nextSlug)) {
      nextSlug = `${baseSlug}-${n}`;
      n += 1;
    }

    try {
      await createEventType({
        title: `${event.title} (Copy)`,
        slug: nextSlug,
        duration: event.duration,
        description: event.description || '',
        isActive: event.isActive ?? true,
      });
      await fetchEventTypes();
    } catch (error) {
      console.error('Error duplicating event type:', error);
      alert('Failed to duplicate event type. Please try again.');
    }
  };

  const handleToggleActive = async (event: EventType, nextValue: boolean) => {
    try {
      await updateEventType(event.id, {
        title: event.title,
        slug: event.slug,
        duration: event.duration,
        description: event.description || '',
        isActive: nextValue,
      });
      await fetchEventTypes();
    } catch (error) {
      console.error('Error updating event status:', error);
      alert('Failed to update status. Please try again.');
    }
  };

  const handleCreateEventType = () => {
    setCreateMenuOpen(false);
    setActiveTab('Event types');
    setEditingEvent(null);
    setEventDrawerOpen(true);
  };

  const handleSave = async (data: EventTypeUpsert) => {
    try {
      if (editingEvent) {
        await updateEventType(editingEvent.id, data);
      } else {
        await createEventType(data);
      }
      setEventDrawerOpen(false);
      setEditingEvent(null);
      fetchEventTypes();
    } catch (error) {
      console.error('Error saving event type:', error);
      alert('Failed to save event type. Please try again.');
    }
  };

  const visibleEventTypes = useMemo(
    () =>
      eventTypes.filter((e) => {
        if (!searchTerm.trim()) return true;
        const q = searchTerm.trim().toLowerCase();
        return String(e.title ?? '').toLowerCase().includes(q) || String(e.slug ?? '').toLowerCase().includes(q);
      }),
    [eventTypes, searchTerm]
  );

  useEffect(() => {
    if (selectedEventIds.length === 0) return;
    const existingIds = new Set(eventTypes.map((event) => event.id));
    setSelectedEventIds((prev) => prev.filter((id) => existingIds.has(id)));
  }, [eventTypes, selectedEventIds.length]);

  useEffect(() => {
    if (activeTab !== 'Event types') {
      setSelectedEventIds([]);
      setBulkToggleMenuOpen(false);
    }
  }, [activeTab]);

  return (
    <div className="pb-20">
      {/* Header */}
      <div className="mt-2 mb-4 flex flex-col gap-3 sm:mt-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-[24px] font-bold text-slate-900 sm:text-[28px]">Scheduling</h1>
        </div>

        <div className="relative" ref={createMenuRef}>
          <button
            type="button"
            onClick={() => setCreateMenuOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={createMenuOpen}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-primary px-4 text-[14px] font-bold text-white hover:opacity-90 sm:h-10 sm:w-auto"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>Create</span>
            <span className="material-symbols-outlined text-[18px]">keyboard_arrow_down</span>
          </button>

          {createMenuOpen && (
            <div role="menu" aria-label="Create menu" className="absolute right-0 mt-2 z-50">
              <CreateMenuPopover
                variant="scheduling"
                onCreateEventType={handleCreateEventType}
                onCreateSingleUseLink={() => {
                  setCreateMenuOpen(false);
                  setActiveTab('Single-use links');
                }}
                onCreateMeetingPoll={() => {
                  setCreateMenuOpen(false);
                  setActiveTab('Meeting polls');
                }}
                sidebarAdminTemplatesOpen={adminTemplatesOpen}
                setSidebarAdminTemplatesOpen={setAdminTemplatesOpen}
                sidebarMoreWaysOpen={moreWaysOpen}
                setSidebarMoreWaysOpen={setMoreWaysOpen}
              />
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-4 border-b border-slate-200">
        <nav aria-label="Scheduling options" className="flex items-center gap-4 overflow-x-auto pb-1">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => {
                setActiveTab(tab);
                setSearchTerm('');
              }}
              className={`relative whitespace-nowrap py-3 text-[14px] font-bold transition-colors ${
                activeTab === tab ? 'text-slate-900' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab}
              {activeTab === tab && (
                <span className="absolute left-0 right-0 -bottom-[1px] h-[2px] bg-primary" />
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Search + (optional) filter */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative w-full max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">
            search
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={searchPlaceholder}
            className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-4 text-[14px] font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-primary sm:h-10"
          />
        </div>

        {activeTab === 'Meeting polls' && (
          <button
            type="button"
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-[14px] font-bold text-slate-700 hover:bg-slate-50 sm:h-10 sm:w-auto"
          >
            <span className="material-symbols-outlined text-[18px] text-slate-500">filter_list</span>
            Filter
            <span className="material-symbols-outlined text-[18px] text-slate-500">keyboard_arrow_down</span>
          </button>
        )}
      </div>

      {/* User Context Line (Event types) */}
      {activeTab === 'Event types' && (
        <div className="mb-4 flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-[11px] font-bold text-slate-600">
              OM
            </div>
            <span className="text-[14px] font-bold text-slate-900">OM</span>
          </div>

          {publicUsername && (
            <Link
              href={`/${publicUsername}`}
              target="_blank"
              className="flex items-center gap-1.5 self-start text-[14px] font-bold text-primary hover:underline"
            >
              View landing page
              <span className="material-symbols-outlined text-[16px]">open_in_new</span>
            </Link>
          )}
        </div>
      )}

      {activeTab === 'Event types' && selectedEventIds.length > 0 && (
        <div className="mb-4 rounded-xl border border-slate-300 bg-white px-4 py-3">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="inline-flex items-center gap-2 text-[14px] text-slate-800">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-[12px] font-bold text-primary">
                {selectedEventIds.length}
              </span>
              <span>selected</span>
            </div>

            <button
              type="button"
              onClick={handleBulkDelete}
              className="inline-flex h-11 items-center gap-2 rounded-full border border-slate-400 bg-white px-4 text-[14px] font-bold text-slate-800 hover:bg-slate-50 sm:h-10"
            >
              <span className="material-symbols-outlined text-[18px]">delete</span>
              Delete
            </button>

            <div className="relative" ref={bulkToggleRef}>
              <button
                type="button"
                onClick={() => setBulkToggleMenuOpen((v) => !v)}
                className="inline-flex h-11 items-center gap-2 rounded-full border border-slate-400 bg-white px-4 text-[14px] font-bold text-slate-800 hover:bg-slate-50 sm:h-10"
              >
                Toggle on/off
                <span className="material-symbols-outlined text-[18px]">keyboard_arrow_down</span>
              </button>

              {bulkToggleMenuOpen && (
                <div className="absolute left-0 top-full z-20 mt-2 w-40 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
                  <button
                    type="button"
                    className="w-full px-4 py-2 text-left text-[14px] font-medium text-slate-900 hover:bg-slate-50"
                    onClick={() => handleBulkToggleActive(true)}
                  >
                    Turn on
                  </button>
                  <button
                    type="button"
                    className="w-full px-4 py-2 text-left text-[14px] font-medium text-slate-900 hover:bg-slate-50"
                    onClick={() => handleBulkToggleActive(false)}
                  >
                    Turn off
                  </button>
                </div>
              )}
            </div>

            <button
              type="button"
              disabled
              className="inline-flex h-11 items-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-4 text-[14px] font-bold text-slate-400 sm:h-10"
            >
              <span className="material-symbols-outlined text-[18px]">content_paste</span>
              Copy availability from
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedEventIds([]);
                setBulkToggleMenuOpen(false);
              }}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-600 hover:bg-slate-50 sm:ml-auto sm:h-9 sm:w-9"
              aria-label="Clear selection"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        </div>
      )}

      {/* Tab Content */}
      {activeTab === 'Event types' && (
        <>
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {eventTypes.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  {visibleEventTypes.map((event) => (
                    <EventCard
                      key={event.id}
                      id={event.id}
                      title={event.title}
                      slug={event.slug}
                      duration={event.duration}
                      description={event.description}
                      bookingUrl={event.bookingUrl}
                      publicUsername={publicUsername ?? undefined}
                      isActive={event.isActive ?? true}
                      onDelete={handleDelete}
                      onEdit={handleEdit}
                      onBookMeeting={handleBookMeeting}
                      onCreateSingleUseLink={handleCreateSingleUseLink}
                      onDuplicate={handleDuplicate}
                      onToggleActive={handleToggleActive}
                      onSelect={handleToggleSelection}
                      onToggleSelect={handleToggleSelection}
                      selected={selectedEventIds.includes(event.id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 py-20 text-center">
                  <p className="font-medium text-slate-500">No event types found.</p>
                  <button
                    type="button"
                    onClick={handleCreateEventType}
                    className="mt-4 inline-flex h-11 items-center gap-2 rounded-full bg-primary px-5 text-[14px] font-bold text-white hover:opacity-90 sm:h-10"
                  >
                    <span className="material-symbols-outlined text-[18px]">add</span>
                    Create event type
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {activeTab === 'Single-use links' && (
        <div className="mt-8 rounded-2xl bg-slate-50 p-8">
          <h2 className="text-[20px] font-bold text-slate-900">Share one-time booking links</h2>
          <p className="mt-2 max-w-2xl text-[14px] font-medium text-slate-600">
            Single-use links let you generate a one-off scheduling link without creating a permanent event type.
          </p>
          <div className="mt-6">
            <button
              type="button"
              className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-5 text-[14px] font-bold text-white hover:opacity-90 sm:h-10"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Create single-use link
            </button>
          </div>
        </div>
      )}

      {activeTab === 'Meeting polls' && (
        <div className="mt-6 overflow-hidden rounded-2xl bg-white">
          <div className="grid grid-cols-1 items-center gap-8 rounded-2xl bg-slate-50 p-8 md:grid-cols-2">
            <div>
              <h2 className="text-[20px] font-bold text-slate-900">Find the best time for everyone</h2>
              <p className="mt-2 text-[14px] font-medium text-slate-600">
                Gather everyone’s availability to pick the best time for the group. Track votes as they come in, and book the most popular time.
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  className="inline-flex h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-5 text-[14px] font-bold text-slate-800 hover:bg-slate-50 sm:h-10"
                >
                  <span className="material-symbols-outlined text-[18px] text-slate-500">help_outline</span>
                  Learn more
                  <span className="material-symbols-outlined text-[18px] text-slate-500">chevron_right</span>
                </button>
                <button
                  type="button"
                  className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-5 text-[14px] font-bold text-white hover:opacity-90 sm:h-10"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  Create meeting poll
                </button>
              </div>
            </div>

            <div className="flex justify-center md:justify-end">
              <div className="flex h-[180px] w-[240px] items-center justify-center rounded-2xl bg-white">
                <span className="material-symbols-outlined text-[64px] text-slate-300">calendar_month</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <EventDrawer
        isOpen={eventDrawerOpen}
        onClose={() => {
          setEventDrawerOpen(false);
          setEditingEvent(null);
        }}
        onSave={handleSave}
        initialData={
          editingEvent
            ? {
                title: editingEvent.title,
                duration: editingEvent.duration,
                slug: editingEvent.slug,
                description: editingEvent.description ?? '',
                isActive: editingEvent.isActive ?? true,
              }
            : undefined
        }
      />

      <SingleUseLinkDrawer
        isOpen={singleUseLinkDrawerOpen}
        onClose={() => setSingleUseLinkDrawerOpen(false)}
        onSave={() => setSingleUseLinkDrawerOpen(false)}
      />

      <MeetingPollDrawer
        isOpen={meetingPollDrawerOpen}
        onClose={() => setMeetingPollDrawerOpen(false)}
        onSave={() => setMeetingPollDrawerOpen(false)}
      />
    </div>
  );
}
