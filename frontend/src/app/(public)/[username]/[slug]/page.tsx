'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import { getPublicEventDetails, getPublicSlots } from '@/lib/api';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isToday,
  isBefore,
  startOfDay,
} from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import type { PublicEventData } from '@/types/public';

export default function BookingPage() {
  const { username, slug } = useParams<{ username: string; slug: string }>();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [eventData, setEventData] = useState<PublicEventData | null>(null);
  const [error, setError] = useState('');

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const [slotsLoading, setSlotsLoading] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);

  const hostTimeZone = eventData?.user?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;

  useEffect(() => {
    const fetchEventData = async () => {
      try {
        const data = await getPublicEventDetails(username, slug);
        setEventData(data);
      } catch (err: unknown) {
        if (axios.isAxiosError(err)) {
          setError((err.response?.data as { error?: string } | undefined)?.error || 'Event not found');
        } else {
          setError('Event not found');
        }
      } finally {
        setLoading(false);
      }
    };
    if (username && slug) fetchEventData();
  }, [username, slug]);

  const fetchSlots = useCallback(async (date: Date) => {
    setSlotsLoading(true);
    setSelectedSlot(null);
    try {
      const formattedDate = format(date, 'yyyy-MM-dd');
      const data = await getPublicSlots(username, slug, formattedDate);
      const slots = data.map((slot) => slot.time);
      setAvailableSlots(slots);
    } catch (err) {
      console.error(err);
      setAvailableSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  }, [username, slug]);

  const handleDateClick = (date: Date) => {
    if (isBefore(date, startOfDay(new Date()))) return; // can't book past days
    setSelectedDate(date);
    fetchSlots(date);
  };

  useEffect(() => {
    if (!selectedDate) return;

    const refreshSlots = () => {
      void fetchSlots(selectedDate);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshSlots();
      }
    };

    window.addEventListener('focus', refreshSlots);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', refreshSlots);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [selectedDate, fetchSlots]);

  useEffect(() => {
    if (!selectedDate) return;

    const intervalId = window.setInterval(() => {
      void fetchSlots(selectedDate);
    }, 15000);

    return () => window.clearInterval(intervalId);
  }, [selectedDate, fetchSlots]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  if (error || !eventData) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-red-500 font-medium">{error || 'Event not found'}</div>
      </div>
    );
  }

  const { eventType, user } = eventData;

  // Calendar logic — JS getDay() returns 0=Sunday, so headers must start on Sunday
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = monthStart.getDay(); // 0=Sun, 1=Mon, ...
  const paddingDays = Array(startDayOfWeek).fill(null);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <span className="text-[12px] font-medium text-slate-500 uppercase">CalClo</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-200">
          <div className="grid grid-cols-1 md:grid-cols-3 md:min-h-[600px] relative">
            {/* Left Panel - Event Details */}
            <div className="border-b border-slate-200 p-4 sm:p-6 md:border-b-0 md:border-r">
              <button
                onClick={() => router.back()}
                className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-slate-100"
              >
                <span className="material-symbols-outlined text-[20px] text-primary">arrow_back</span>
              </button>

              <div className="text-[12px] font-medium text-slate-500 uppercase tracking-wide mb-1">
                {user.name}
              </div>
              <h1 className="text-[28px] font-bold text-slate-900 mb-4">{eventType.title}</h1>

              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-[18px] text-slate-500">schedule</span>
                <span className="text-[14px] font-medium text-slate-700">{eventType.duration} min</span>
              </div>

              {eventType.description && (
                <div className="text-[13px] text-slate-600 mt-4">{eventType.description}</div>
              )}

              {selectedDate && selectedSlot && (
                <div className="mt-6 space-y-2 text-[13px]">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-slate-500">event</span>
                    <span className="text-slate-700 font-medium">
                      {formatInTimeZone(new Date(selectedSlot), hostTimeZone, 'h:mma, EEEE, MMMM d, yyyy')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-slate-500">public</span>
                    <span className="text-slate-700 font-medium">{hostTimeZone}</span>
                  </div>
                </div>
              )}

              <div className="mt-8 pt-6 border-t border-slate-200">
              </div>
            </div>

            {/* Right Panel - Calendar & Slots */}
            <div className="p-4 sm:p-6 md:col-span-2">
              <h2 className="text-[18px] font-bold text-slate-900 mb-4">Select a Date & Time</h2>

              {/* Month Navigation */}
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                  disabled={isBefore(startOfMonth(currentMonth), startOfMonth(new Date()))}
                  className="inline-flex h-11 w-11 items-center justify-center rounded transition-colors hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent"
                >
                  <span className="material-symbols-outlined text-[20px] text-slate-600">chevron_left</span>
                </button>
                <span className="text-[16px] font-bold text-slate-900">{format(currentMonth, 'MMMM yyyy')}</span>
                <button
                  onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                  className="inline-flex h-11 w-11 items-center justify-center rounded transition-colors hover:bg-slate-100"
                >
                  <span className="material-symbols-outlined text-[20px] text-slate-600">chevron_right</span>
                </button>
              </div>

              {/* Calendar Grid */}
              <div className="flex flex-col gap-4 lg:flex-row">
                {/* Calendar */}
                <div className="flex-1">
                  {/* Day headers */}
                  <div className="mb-2 grid grid-cols-7 gap-1.5 sm:gap-2">
                    {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((d) => (
                      <div key={d} className="text-center text-[10px] font-bold text-slate-500 py-2 sm:text-[12px]">
                        {d}
                      </div>
                    ))}
                  </div>

                  {/* Calendar Days */}
                  <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                    {paddingDays.map((_, i) => (
                      <div key={`padding-${i}`} />
                    ))}
                    {daysInMonth.map((day, i) => {
                      const past = isBefore(day, startOfDay(new Date()));
                      const isSelected = selectedDate && isSameDay(day, selectedDate);

                      return (
                        <button
                          key={i}
                          disabled={past}
                          onClick={() => handleDateClick(day)}
                          className={`
                            aspect-square rounded-md text-[13px] font-medium transition-colors
                            ${past ? 'text-slate-300 cursor-not-allowed' : ''}
                            ${isSelected ? 'bg-primary text-white hover:bg-blue-700' : 'text-slate-600 hover:bg-slate-100'}
                            ${isToday(day) && !isSelected ? 'bg-slate-100' : ''}
                          `}
                        >
                          {format(day, 'd')}
                        </button>
                      );
                    })}
                  </div>

                  {/* Timezone */}
                  <div className="mt-6 text-[12px] text-slate-600">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="material-symbols-outlined text-[16px]">public</span>
                      <strong>Time zone</strong>
                    </div>
                    <button className="text-primary font-bold text-[12px] flex items-center gap-1 hover:underline">
                      <span className="material-symbols-outlined text-[16px]">public</span>
                      {hostTimeZone}
                      <span className="material-symbols-outlined text-[12px]">expand_more</span>
                    </button>
                  </div>

                  <p className="mt-2 text-[11px] text-slate-500">Times shown in host timezone.</p>

                  {/* Troubleshoot Button */}
                  <div className="mt-4">
                    <button className="px-4 py-2 rounded-full border border-slate-300 text-[13px] font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px]">help</span>
                      Troubleshoot
                    </button>
                  </div>
                </div>

                {/* Time Slots */}
                {selectedDate && (
                  <div className="w-full rounded-lg border border-slate-200 bg-slate-50 p-4 lg:w-56">
                    <div className="text-[14px] font-bold text-slate-900 mb-4">
                      {format(selectedDate, 'EEEE, MMMM d')}
                    </div>

                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {slotsLoading ? (
                        <div className="text-center py-6 text-slate-500 text-[12px]">
                          <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-primary mx-auto" />
                        </div>
                      ) : availableSlots.length === 0 ? (
                        <div className="text-center py-6 text-slate-500 text-[12px]">
                          No time slots available
                        </div>
                      ) : (
                        availableSlots.map((slotIso) => {
                          const slotDate = new Date(slotIso);
                          const slotTime = formatInTimeZone(slotDate, hostTimeZone, 'h:mma');
                          const isSelected = selectedSlot === slotIso;
                          const slotHostDate = formatInTimeZone(slotDate, hostTimeZone, 'yyyy-MM-dd');

                          return (
                            <div key={slotIso} className="flex gap-2">
                              <button
                                onClick={() => setSelectedSlot(slotIso)}
                                className={`
                                  flex-1 py-2 px-3 rounded-lg text-[12px] font-bold transition-colors
                                  ${isSelected
                                    ? 'bg-slate-700 text-white'
                                    : 'bg-white border border-slate-200 text-slate-700 hover:border-slate-300'
                                  }
                                `}
                              >
                                {slotTime}
                              </button>
                              {isSelected && (
                                <button
                                  onClick={() =>
                                    router.push(
                                      `/${username}/${slug}/book?date=${slotHostDate}&time=${encodeURIComponent(slotIso)}`
                                    )
                                  }
                                    className="min-h-11 rounded-lg bg-primary px-4 py-2 text-[12px] font-bold text-white transition-colors hover:bg-blue-700"
                                >
                                  Next
                                </button>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
