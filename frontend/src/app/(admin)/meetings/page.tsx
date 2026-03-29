'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { getMeetings, cancelMeeting } from '@/lib/api';
import type { MeetingRecord } from '@/types/booking';
import Link from 'next/link';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isAfter,
  isBefore,
  isSameDay,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns';

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<MeetingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState('Upcoming');
  const [showBufferTime, setShowBufferTime] = useState(true);
  const [sourceFilter, setSourceFilter] = useState<'My CalClo' | 'Team booking page'>('My CalClo');
  const [showDateRangePicker, setShowDateRangePicker] = useState(false);
  const [baseMonth, setBaseMonth] = useState(startOfMonth(new Date()));
  const [selectedPreset, setSelectedPreset] = useState<'Today' | 'This week' | 'This month' | 'All time'>('Today');
  const [appliedRange, setAppliedRange] = useState<{ start: Date | null; end: Date | null }>({
    start: startOfDay(new Date()),
    end: startOfDay(new Date()),
  });
  const [draftRange, setDraftRange] = useState<{ start: Date | null; end: Date | null }>({
    start: startOfDay(new Date()),
    end: startOfDay(new Date()),
  });
  const dateRangeRef = useRef<HTMLDivElement | null>(null);

  const tabs = ['Upcoming', 'Past', 'Date Range'];

  const weekDays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  useEffect(() => {
    fetchMeetings();
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!dateRangeRef.current?.contains(event.target as Node)) {
        setShowDateRangePicker(false);
      }
    };

    if (showDateRangePicker) {
      document.addEventListener('mousedown', handleOutsideClick);
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [showDateRangePicker]);

  const fetchMeetings = async (currentTab?: string) => {
    try {
      setLoading(true);
      const tab = currentTab ?? activeTab;
      const statusParam = tab === 'Upcoming' ? 'upcoming' : tab === 'Past' ? 'past' : undefined;
      const data = await getMeetings(statusParam);
      setMeetings(data);
    } catch (error) {
      console.error('Error fetching meetings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelMeeting = async (meetingId: number) => {
    const confirmed = window.confirm('Cancel this meeting?');
    if (!confirmed) return;

    try {
      setCancellingId(meetingId);
      await cancelMeeting(meetingId);
      setMeetings((prev) =>
        prev.map((meeting) =>
          meeting.id === meetingId ? { ...meeting, status: 'CANCELLED' } : meeting
        )
      );
    } catch (error) {
      console.error('Error cancelling meeting:', error);
      window.alert('Failed to cancel meeting. Please try again.');
    } finally {
      setCancellingId(null);
    }
  };

  const getPresetRange = (preset: 'Today' | 'This week' | 'This month' | 'All time') => {
    const today = startOfDay(new Date());

    if (preset === 'Today') {
      return { start: today, end: today };
    }

    if (preset === 'This week') {
      return {
        start: startOfWeek(today, { weekStartsOn: 0 }),
        end: endOfWeek(today, { weekStartsOn: 0 }),
      };
    }

    if (preset === 'This month') {
      return {
        start: startOfMonth(today),
        end: endOfMonth(today),
      };
    }

    return { start: null, end: null };
  };

  const handlePresetSelect = (preset: 'Today' | 'This week' | 'This month' | 'All time') => {
    setSelectedPreset(preset);
    const range = getPresetRange(preset);
    setDraftRange(range);
    setBaseMonth(startOfMonth(range.start ?? new Date()));
  };

  const handleDateSelection = (date: Date) => {
    setSelectedPreset('All time');

    if (!draftRange.start || (draftRange.start && draftRange.end)) {
      setDraftRange({ start: date, end: null });
      return;
    }

    if (!draftRange.end) {
      if (isBefore(date, draftRange.start)) {
        setDraftRange({ start: date, end: draftRange.start });
      } else {
        setDraftRange({ start: draftRange.start, end: date });
      }
    }
  };

  const openDateRangePicker = () => {
    setActiveTab('Date Range');
    setShowDateRangePicker(true);
    setDraftRange(appliedRange);
    setBaseMonth(startOfMonth((appliedRange.start ?? new Date())));
  };

  const applyDateRange = () => {
    setAppliedRange(draftRange);
    setShowDateRangePicker(false);
  };

  const cancelDateRange = () => {
    setDraftRange(appliedRange);
    setShowDateRangePicker(false);
  };

  const isInSelectedRange = (date: Date) => {
    if (!draftRange.start || !draftRange.end) return false;
    return (
      (isAfter(date, draftRange.start) || isSameDay(date, draftRange.start)) &&
      (isBefore(date, draftRange.end) || isSameDay(date, draftRange.end))
    );
  };

  const buildMonthGrid = (month: Date) => {
    const start = startOfMonth(month);
    const end = endOfMonth(month);
    const daysInMonth = eachDayOfInterval({ start, end });
    const leadingOffset = start.getDay();

    return [
      ...Array.from({ length: leadingOffset }, () => null),
      ...daysInMonth,
    ];
  };

  const leftMonthDays = useMemo(() => buildMonthGrid(baseMonth), [baseMonth]);
  const rightMonth = useMemo(() => addMonths(baseMonth, 1), [baseMonth]);
  const rightMonthDays = useMemo(() => buildMonthGrid(rightMonth), [rightMonth]);

  const filteredMeetings = meetings.filter((meeting) => {
    if (!meeting?.startTime) return false;
    const start = new Date(meeting.startTime).getTime();
    const now = Date.now();
    if (activeTab === 'Upcoming') return start >= now;
    if (activeTab === 'Past') return start < now;
    if (activeTab === 'Date Range') {
      if (!appliedRange.start || !appliedRange.end) return true;
      const meetingDate = startOfDay(new Date(meeting.startTime));
      return (
        (isAfter(meetingDate, appliedRange.start) || isSameDay(meetingDate, appliedRange.start)) &&
        (isBefore(meetingDate, appliedRange.end) || isSameDay(meetingDate, appliedRange.end))
      );
    }
    return true;
  });

  const totalCount = filteredMeetings.length;
  const displayStart = totalCount === 0 ? 0 : 1;
  const displayEnd = totalCount;

  return (
    <div className="pb-20 pt-4">
      <div className="mb-4 flex items-center gap-2">
        <h1 className="text-[20px] font-bold text-slate-900">Meetings ({totalCount})</h1>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setSourceFilter('My CalClo')}
          className={`inline-flex h-9 items-center rounded-md border px-3 text-[11px] font-semibold transition-colors ${
            sourceFilter === 'My CalClo'
              ? 'border-slate-300 bg-white text-slate-800'
              : 'border-transparent bg-slate-100 text-slate-500 hover:text-slate-700'
          }`}
        >
          My CalClo
        </button>

        <button
          type="button"
          onClick={() => setShowBufferTime((v) => !v)}
          className="inline-flex h-9 items-center gap-2 text-[11px] font-semibold text-slate-600"
        >
          <span>Show buffer time</span>
          <span
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors sm:h-[16px] sm:w-[28px] ${
              showBufferTime ? 'bg-primary' : 'bg-slate-300'
            }`}
            aria-hidden="true"
          >
            <span
              className={`inline-block h-4 w-4 rounded-full bg-white transition-transform sm:h-[12px] sm:w-[12px] ${
                showBufferTime ? 'translate-x-4 sm:translate-x-[14px]' : 'translate-x-0.5 sm:translate-x-[2px]'
              }`}
            />
          </span>
        </button>
      </div>

      <div className="relative rounded-lg border border-slate-200 bg-white" ref={dateRangeRef}>
        <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-5 overflow-x-auto pb-1">
            {tabs.map((tab) => {
              if (tab === 'Date Range') {
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={openDateRangePicker}
                    className={`relative inline-flex items-center gap-1 py-1 text-[11px] font-semibold ${
                      activeTab === tab ? 'text-slate-900' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {tab}
                    <span className="material-symbols-outlined text-[12px]">
                      {showDateRangePicker ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}
                    </span>
                    {activeTab === tab && <span className="absolute -bottom-[10px] left-0 right-0 h-[2px] bg-primary" />}
                  </button>
                );
              }

              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab);
                    setShowDateRangePicker(false);
                    void fetchMeetings(tab);
                  }}
                  className={`relative py-1 text-[11px] font-semibold ${
                    activeTab === tab ? 'text-slate-900' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {tab}
                  {activeTab === tab && <span className="absolute -bottom-[10px] left-0 right-0 h-[2px] bg-primary" />}
                </button>
              );
            })}
          </div>

          <div className="flex w-full items-center gap-2 sm:w-auto">
            <button
              type="button"
              className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full border border-slate-300 px-2.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 sm:h-7 sm:flex-none"
            >
              <span className="material-symbols-outlined text-[14px]">ios_share</span>
              Export
            </button>

            <button
              type="button"
              className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full border border-slate-300 px-2.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 sm:h-7 sm:flex-none"
            >
              <span className="material-symbols-outlined text-[14px]">filter_list</span>
              Filter
            </button>
          </div>
        </div>

        {showDateRangePicker && (
          <div className="border-t border-slate-200 px-4 py-4">
            <div className="rounded-md border border-slate-300 bg-white p-4">
            <div className="mb-4 flex items-center gap-5 overflow-x-auto border-b border-slate-200 pb-3 text-[11px] font-semibold text-primary whitespace-nowrap">
              {(['Today', 'This week', 'This month', 'All time'] as const).map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handlePresetSelect(preset)}
                  className={`${selectedPreset === preset ? 'text-primary' : 'text-slate-600 hover:text-slate-800'}`}
                >
                  {preset}
                </button>
              ))}
            </div>

            <div className="flex items-start justify-between gap-2 sm:gap-4">
              <button
                type="button"
                onClick={() => setBaseMonth(subMonths(baseMonth, 1))}
                className="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-700 hover:bg-slate-100 sm:h-9 sm:w-9"
                aria-label="Previous month"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_left</span>
              </button>

              <div className="grid flex-1 grid-cols-1 gap-2 sm:gap-6 md:grid-cols-2 md:gap-8">
                {[{ month: baseMonth, days: leftMonthDays }, { month: rightMonth, days: rightMonthDays }].map(
                  ({ month, days }) => (
                    <div key={month.toISOString()}>
                      <h3 className="mb-4 text-center text-[24px] font-semibold leading-none text-slate-900">
                        {format(month, 'MMMM yyyy')}
                      </h3>

                      <div className="mb-2 grid grid-cols-7 gap-x-1 text-center text-[10px] font-semibold text-slate-600 sm:text-[12px]">
                        {weekDays.map((day) => (
                          <span key={`${month.toISOString()}-${day}`} className="truncate">{day}</span>
                        ))}
                      </div>

                      <div className="grid grid-cols-7 gap-x-1 gap-y-1 text-center">
                        {days.map((date, index) => {
                          if (!date) {
                            return <span key={`${month.toISOString()}-empty-${index}`} className="h-8" />;
                          }

                          const isStart = draftRange.start ? isSameDay(date, draftRange.start) : false;
                          const isEnd = draftRange.end ? isSameDay(date, draftRange.end) : false;
                          const isSingle = Boolean(draftRange.start && draftRange.end && isStart && isEnd);
                          const inRange = isInSelectedRange(date);

                          return (
                            <button
                              key={date.toISOString()}
                              type="button"
                              onClick={() => handleDateSelection(startOfDay(date))}
                              className={`mx-auto inline-flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-semibold leading-none sm:h-9 sm:w-9 sm:text-[12px] ${
                                isStart || isEnd
                                  ? 'bg-primary text-white'
                                  : inRange
                                  ? 'bg-blue-50 text-primary'
                                  : 'text-slate-900 hover:bg-slate-100'
                              } ${isSingle ? 'ring-0' : ''}`}
                            >
                              {format(date, 'd')}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )
                )}
              </div>

              <button
                type="button"
                onClick={() => setBaseMonth(addMonths(baseMonth, 1))}
                className="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-700 hover:bg-slate-100 sm:h-9 sm:w-9"
                aria-label="Next month"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
              </button>
            </div>

            <div className="mt-5 flex items-center justify-center gap-6">
              <button
                type="button"
                onClick={cancelDateRange}
                className="text-[12px] font-semibold text-slate-800 hover:text-slate-950"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={applyDateRange}
                className="rounded-full bg-primary px-5 py-1.5 text-[12px] font-semibold text-white hover:opacity-95"
              >
                Apply
              </button>
            </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-end px-4 py-2 text-[10px] font-medium text-slate-500">
          Displaying {displayStart} - {displayEnd} of {totalCount} Events
        </div>

        <div className="min-h-[310px] border-t border-slate-100">
          {loading ? (
            <div className="flex h-[260px] items-center justify-center">
              <div className="h-7 w-7 animate-spin rounded-full border-b-2 border-primary" />
            </div>
          ) : totalCount > 0 ? (
            <div className="flex flex-col gap-2 p-3">
              {filteredMeetings.map((meeting) => {
                const isCancelled = meeting.status === 'CANCELLED';
                const isUpcoming = new Date(meeting.startTime).getTime() >= Date.now();
                const canCancel = isUpcoming && !isCancelled;

                return (
                  <div
                    key={meeting.id}
                    className="flex flex-col gap-3 rounded-md border border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="text-[13px] font-semibold text-slate-900">{meeting.inviteeName || 'Invitee'}</p>
                      <p className="mt-1 text-[12px] text-slate-500">
                        {new Date(meeting.startTime).toLocaleString()} • {meeting.eventType?.title || 'Meeting'}
                      </p>
                      {isCancelled && (
                        <p className="mt-1 text-[11px] font-semibold text-red-600">Cancelled</p>
                      )}
                    </div>

                    {canCancel ? (
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        {meeting.uid && (
                          <Link
                            href={`/reschedule/${meeting.uid}`}
                            target="_blank"
                            className="flex h-9 w-full items-center justify-center rounded-full border border-blue-300 px-3 text-[11px] font-semibold text-blue-600 hover:bg-blue-50 sm:h-8 sm:w-auto sm:min-w-[90px]"
                          >
                            Reschedule
                          </Link>
                        )}
                        <button
                          type="button"
                          onClick={() => handleCancelMeeting(meeting.id)}
                          disabled={cancellingId === meeting.id}
                          className="h-9 w-full rounded-full border border-red-300 px-3 text-[11px] font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 sm:h-8 sm:w-auto sm:min-w-[70px]"
                        >
                          {cancellingId === meeting.id ? 'Cancelling...' : 'Cancel'}
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="h-9 w-full rounded-full border border-slate-300 px-3 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 sm:h-8 sm:w-auto"
                      >
                        Details
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex h-[260px] flex-col items-center justify-center text-center">
              <div className="relative mb-2">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-500">
                  <span className="material-symbols-outlined text-[20px]">calendar_month</span>
                </div>
                <span className="absolute -right-1 -top-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-slate-600 text-[9px] font-bold text-white">
                  0
                </span>
              </div>

              <h2 className="text-[14px] font-semibold text-slate-900">No Events Yet</h2>
              <p className="mt-1 text-[10px] text-slate-500">
                Share your link to your event types to start receiving bookings.
              </p>

              <Link
                href="/"
                className="mt-2 inline-flex h-8 items-center rounded-full bg-primary px-3 text-[10px] font-semibold text-white hover:opacity-90"
              >
                View event types
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
