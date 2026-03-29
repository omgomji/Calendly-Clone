'use client';

import { useState, useEffect } from 'react';

export interface EventDrawerData {
  title: string;
  duration: number;
  slug: string;
  description: string;
  isActive: boolean;
}

interface EventDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: EventDrawerData) => void;
  initialData?: Partial<EventDrawerData>;
}

const DURATION_OPTIONS = [15, 30, 45, 60, 90];

export default function EventDrawer({
  isOpen,
  onClose,
  onSave,
  initialData,
}: EventDrawerProps) {
  const isEditing = Boolean(initialData?.title);

  // Controlled state — reset whenever initialData changes (create vs edit)
  const [title, setTitle] = useState(initialData?.title ?? '');
  const [slug, setSlug] = useState(initialData?.slug ?? '');
  const [description, setDescription] = useState(initialData?.description ?? '');
  const [duration, setDuration] = useState(initialData?.duration ?? 30);
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    duration: false,
    location: false,
    availability: false,
    inviteeLimit: false,
    host: false,
  });

  // Reset form whenever initialData changes (e.g., open create vs edit)
  useEffect(() => {
    setTitle(initialData?.title ?? '');
    setSlug(initialData?.slug ?? '');
    setDescription(initialData?.description ?? '');
    setDuration(initialData?.duration ?? 30);
    setIsActive(initialData?.isActive ?? true);
    setSlugManuallyEdited(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialData?.title, initialData?.slug]);

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (!slugManuallyEdited) {
      setSlug(value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
    }
  };

  const handleSlugChange = (value: string) => {
    setSlug(value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
    setSlugManuallyEdited(true);
  };

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalSlug = slug.trim() || title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    onSave({
      title: title.trim(),
      duration,
      slug: finalSlug,
      description: description.trim(),
      isActive,
    });
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-slate-900/20"
        onClick={onClose}
      />

      {/* Right Drawer */}
      <div className="fixed right-0 top-0 w-full max-w-md h-screen z-50 bg-white shadow-2xl overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 p-4 flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="text-[12px] font-medium text-slate-500 mb-1">Event type</div>
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 rounded-full bg-purple-500 shrink-0" />
              <input
                id="event-title"
                type="text"
                required
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="New meeting"
                className="w-full bg-transparent text-[18px] font-bold text-slate-900 outline-none placeholder:text-slate-300"
                aria-label="Meeting name"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ml-3 p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600 shrink-0"
            aria-label="Close drawer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Content */}
        <form id="event-drawer-form" onSubmit={handleSubmit} className="p-4 space-y-0">
          
          {/* Slug field */}
          <div className="border-b border-slate-200 py-3 px-2">
            <label className="block text-[12px] font-semibold text-slate-600 mb-1">URL Slug</label>
            <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 overflow-hidden">
              <span className="px-2 py-2 text-[12px] text-slate-400 border-r border-slate-200 whitespace-nowrap">
                /{'{'}username{'}'}/
              </span>
              <input
                type="text"
                value={slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                placeholder="event-slug"
                className="flex-1 bg-transparent px-2 py-2 text-[13px] text-slate-800 outline-none"
                aria-label="URL Slug"
              />
            </div>
          </div>

          {/* Description */}
          <div className="border-b border-slate-200 py-3 px-2">
            <label className="block text-[12px] font-semibold text-slate-600 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this meeting is for..."
              rows={3}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[13px] text-slate-800 outline-none focus:border-primary resize-none"
            />
          </div>

          {/* Duration Section */}
          <div className="border-b border-slate-200">
            <button
              type="button"
              onClick={() => toggleSection('duration')}
              className="w-full flex items-center justify-between py-3 px-2 text-left"
            >
              <div>
                <span className="text-[14px] font-bold text-slate-900">Duration</span>
                {!expandedSections.duration && (
                  <span className="ml-2 text-[13px] text-slate-500">{duration} min</span>
                )}
              </div>
              <span className="material-symbols-outlined text-[20px] text-slate-600">
                {expandedSections.duration ? 'expand_less' : 'expand_more'}
              </span>
            </button>

            {expandedSections.duration && (
              <div className="pb-3 px-2">
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-[18px] text-slate-500">schedule</span>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-[13px] focus:outline-none focus:border-primary"
                  >
                    {DURATION_OPTIONS.map((d) => (
                      <option key={d} value={d}>{d} min</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Location Section */}
          <div className="border-b border-slate-200">
            <button
              type="button"
              onClick={() => toggleSection('location')}
              className="w-full flex items-center justify-between py-3 px-2 text-left"
            >
              <span className="text-[14px] font-bold text-slate-900">Location</span>
              <span className="material-symbols-outlined text-[20px] text-slate-600">
                {expandedSections.location ? 'expand_less' : 'expand_more'}
              </span>
            </button>

            {expandedSections.location && (
              <div className="pb-3 px-2">
                <div className="flex gap-2 mb-2">
                  <button
                    type="button"
                    className="flex-1 py-2 px-3 rounded-lg border border-slate-200 text-[13px] font-medium text-slate-600 hover:bg-slate-50"
                  >
                    <span className="material-symbols-outlined inline text-[18px]">videocam</span>
                    <div className="text-[12px]">Zoom</div>
                  </button>
                  <button
                    type="button"
                    className="flex-1 py-2 px-3 rounded-lg border border-slate-200 text-[13px] font-medium text-slate-600 hover:bg-slate-50"
                  >
                    <span className="material-symbols-outlined inline text-[18px]">phone</span>
                    <div className="text-[12px]">Phone</div>
                  </button>
                  <button
                    type="button"
                    className="flex-1 py-2 px-3 rounded-lg border border-slate-200 text-[13px] font-medium text-slate-600 hover:bg-slate-50"
                  >
                    <span className="material-symbols-outlined inline text-[18px]">location_on</span>
                    <div className="text-[12px]">In-person</div>
                  </button>
                </div>
                <div className="text-[12px] text-slate-500">
                  <span className="material-symbols-outlined inline text-[16px]">info</span>
                  No location set
                </div>
              </div>
            )}
          </div>

          {/* Availability Section */}
          <div className="border-b border-slate-200">
            <button
              type="button"
              onClick={() => toggleSection('availability')}
              className="w-full flex items-center justify-between py-3 px-2 text-left"
            >
              <span className="text-[14px] font-bold text-slate-900">Availability</span>
              <span className="material-symbols-outlined text-[20px] text-slate-600">
                {expandedSections.availability ? 'expand_less' : 'expand_more'}
              </span>
            </button>

            {expandedSections.availability && (
              <div className="pb-3 px-2">
                <div className="text-[13px] font-medium text-slate-700 mb-2">
                  Based on your availability schedule
                </div>
              </div>
            )}
          </div>

          {/* Active toggle */}
          <div className="border-b border-slate-200 py-3 px-2">
            <div className="flex items-center justify-between">
              <span className="text-[14px] font-bold text-slate-900">Active</span>
              <button
                type="button"
                aria-pressed={isActive}
                aria-label="Toggle event active"
                onClick={() => setIsActive((v) => !v)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  isActive ? 'bg-primary' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isActive ? 'translate-x-4' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
            <p className="mt-1 text-[12px] text-slate-500">
              {isActive ? 'Invitees can book this event' : 'Event is hidden from booking page'}
            </p>
          </div>
        </form>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-slate-200 p-4 flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 px-4 rounded-full border border-slate-200 text-[13px] font-bold text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="event-drawer-form"
            className="flex-1 py-2 px-4 rounded-full bg-primary text-[13px] font-bold text-white hover:opacity-90"
          >
            {isEditing ? 'Save changes' : 'Create'}
          </button>
        </div>
      </div>
    </>
  );
}
