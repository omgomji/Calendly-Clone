'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getRescheduleDetails, getPublicSlots, rescheduleBooking } from '@/lib/api';
import type { RescheduleDetailsResponse } from '@/types/public';
import axios from 'axios';
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

export default function ReschedulePage() {
  const { uid } = useParams<{ uid: string }>();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [eventData, setEventData] = useState<RescheduleDetailsResponse | null>(null);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const [slotsLoading, setSlotsLoading] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);

  const hostTimeZone = eventData?.user?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;

  useEffect(() => {
    const fetchEventData = async () => {
      try {
        const data = await getRescheduleDetails(uid);
        if (data.booking.status === 'CANCELLED') {
           setError('This booking is already cancelled and cannot be rescheduled.');
        } else {
           setEventData(data);
        }
      } catch (err: unknown) {
        if (axios.isAxiosError(err)) {
          setError((err.response?.data as { error?: string } | undefined)?.error || 'Booking not found');
        } else {
          setError('Booking not found');
        }
      } finally {
        setLoading(false);
      }
    };
    if (uid) fetchEventData();
  }, [uid]);

  const fetchSlots = useCallback(async (date: Date) => {
    if (!eventData) return;
    setSlotsLoading(true);
    setSelectedSlot(null);
    try {
      const formattedDate = format(date, 'yyyy-MM-dd');
      const data = await getPublicSlots(eventData.user.username, eventData.eventType.slug, formattedDate);
      const slots = data.map((slot) => slot.time);
      setAvailableSlots(slots);
    } catch (err) {
      console.error(err);
      setAvailableSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  }, [eventData]);

  const handleDateClick = (date: Date) => {
    if (isBefore(date, startOfDay(new Date()))) return; // can't book past days
    setSelectedDate(date);
    fetchSlots(date);
  };

  const handleReschedule = async () => {
    if (!selectedSlot || !eventData) return;
    setIsSubmitting(true);
    try {
      const newBooking = await rescheduleBooking(uid, selectedSlot);
      
      const query = new URLSearchParams({
        bookingId: String(newBooking.id),
        startTime: String(newBooking.startTime),
        endTime: String(newBooking.endTime),
        inviteeName: newBooking.inviteeName,
        inviteeEmail: newBooking.inviteeEmail,
        timezone: hostTimeZone,
      });

      router.push(`/${eventData.user.username}/${eventData.eventType.slug}/success?${query.toString()}`);
    } catch (err: unknown) {
      setIsSubmitting(false);
      if (axios.isAxiosError(err)) {
        window.alert((err.response?.data as { error?: string } | undefined)?.error || 'Failed to reschedule. Please try again.');
      } else {
        window.alert('Failed to reschedule. Please try again.');
      }
    }
  };

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

  const { eventType, user, booking } = eventData;

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = monthStart.getDay();
  const paddingDays = Array(startDayOfWeek).fill(null);

  const prevBookingDate = new Date(booking.startTime);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <span className="text-[12px] font-medium text-slate-500 uppercase">CalClo</span>
        </div>
      </div>

      <div className="flex-1 max-w-5xl mx-auto px-4 py-8 w-full">
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 min-h-[600px] relative">
            <div className="border-b border-slate-200 p-4 md:p-6 md:border-b-0 md:border-r">
              <div className="mb-6">
                <span className="inline-block px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-bold uppercase tracking-wider">
                  Rescheduling
                </span>
              </div>
              <h2 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
                {user.name}
              </h2>
              <h1 className="text-2xl font-bold text-slate-900 mb-4">{eventType.title}</h1>

              <div className="flex flex-col gap-3 text-sm text-slate-600">
                <div className="flex items-center gap-2 font-medium">
                  <span className="material-symbols-outlined text-lg">schedule</span>
                  {eventType.duration} min
                </div>
                
                <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Original Time</p>
                  <p className="font-medium text-slate-800">
                    {formatInTimeZone(prevBookingDate, hostTimeZone, 'EEEE, MMMM d, yyyy')}
                  </p>
                  <p className="text-slate-600">
                    {formatInTimeZone(prevBookingDate, hostTimeZone, 'h:mma')} - {formatInTimeZone(new Date(booking.endTime), hostTimeZone, 'h:mma')}
                  </p>
                </div>
              </div>
              
              {selectedSlot && (
                <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-lg">
                  <p className="text-xs font-semibold text-primary uppercase mb-2">New Time</p>
                  <p className="font-bold text-slate-900">
                     {formatInTimeZone(new Date(selectedSlot), hostTimeZone, 'EEEE, MMMM d, yyyy')}
                  </p>
                  <p className="text-slate-700 font-medium">
                     {formatInTimeZone(new Date(selectedSlot), hostTimeZone, 'h:mma')}
                  </p>
                </div>
              )}
            </div>

            <div className="p-4 md:p-6 md:col-span-2">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Select a New Date & Time</h2>

              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                  disabled={isBefore(startOfMonth(currentMonth), startOfMonth(new Date()))}
                  className="inline-flex h-10 w-10 items-center justify-center rounded transition-colors hover:bg-slate-100 disabled:opacity-30"
                >
                  <span className="material-symbols-outlined text-xl text-slate-600">chevron_left</span>
                </button>
                <span className="text-base font-bold text-slate-900">{format(currentMonth, 'MMMM yyyy')}</span>
                <button
                  onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                  className="inline-flex h-10 w-10 items-center justify-center rounded transition-colors hover:bg-slate-100"
                >
                  <span className="material-symbols-outlined text-xl text-slate-600">chevron_right</span>
                </button>
              </div>

              <div className="flex flex-col gap-6 lg:flex-row">
                <div className="flex-1">
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((d) => (
                      <div key={d} className="text-center text-[10px] font-bold text-slate-500 py-2 sm:text-xs">
                        {d}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-1">
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
                            aspect-square rounded-full text-sm font-medium transition-colors m-auto flex items-center justify-center w-10 h-10
                            ${past ? 'text-slate-300 cursor-not-allowed' : ''}
                            ${isSelected ? 'bg-primary text-white hover:bg-blue-700' : 'text-slate-700 hover:bg-slate-100'}
                            ${isToday(day) && !isSelected ? 'bg-blue-50 text-primary font-bold' : ''}
                          `}
                        >
                          {format(day, 'd')}
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-8 text-xs text-slate-500 flex items-center gap-2">
                    <span className="material-symbols-outlined text-base">public</span>
                    Times shown in <strong className="text-slate-700">{hostTimeZone}</strong>
                  </div>
                </div>

                {selectedDate && (
                  <div className="w-full lg:w-64 border-t lg:border-t-0 lg:border-l border-slate-200 pt-6 lg:pt-0 lg:pl-6">
                    <div className="text-sm font-bold text-slate-900 mb-4 text-center lg:text-left">
                      {format(selectedDate, 'EEEE, MMMM d')}
                    </div>

                    <div className="space-y-2 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                      {slotsLoading ? (
                        <div className="flex justify-center py-8">
                          <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-primary" />
                        </div>
                      ) : availableSlots.length === 0 ? (
                        <div className="text-center py-8 text-slate-500 text-sm">
                          No time slots available
                        </div>
                      ) : (
                        availableSlots.map((slotIso) => {
                          const slotTime = formatInTimeZone(new Date(slotIso), hostTimeZone, 'h:mma');
                          const isSelected = selectedSlot === slotIso;

                          return (
                            <div key={slotIso} className="flex flex-col gap-2">
                              <button
                                onClick={() => setSelectedSlot(slotIso)}
                                className={`
                                  w-full py-3 px-4 rounded-lg text-sm font-bold transition-all
                                  ${isSelected
                                    ? 'bg-slate-800 text-white shadow-md'
                                    : 'bg-white border border-slate-300 text-primary hover:border-primary hover:border-2 hover:py-[11px] hover:px-[15px]'
                                  }
                                `}
                              >
                                {slotTime}
                              </button>
                              {isSelected && (
                                <button
                                  onClick={handleReschedule}
                                  disabled={isSubmitting}
                                  className="w-full rounded-lg bg-primary py-3 text-sm font-bold text-white transition-colors hover:bg-blue-700 disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                  {isSubmitting ? 'Confirming...' : 'Confirm Reschedule'}
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
