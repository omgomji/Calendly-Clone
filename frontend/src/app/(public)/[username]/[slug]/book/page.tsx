'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';
import { createBooking, getPublicEventDetails } from '@/lib/api';
import { formatInTimeZone } from 'date-fns-tz';
import type { PublicEventData } from '@/types/public';

export default function BookingDetailsPage() {
  const { username, slug } = useParams<{ username: string; slug: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();

  const dateParam = searchParams.get('date');
  const timeParam = searchParams.get('time');

  const [loading, setLoading] = useState(true);
  const [eventData, setEventData] = useState<PublicEventData | null>(null);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const selectedStartTime = timeParam;
    if (!selectedStartTime) {
      alert('Invalid booking details');
      setSubmitting(false);
      return;
    }

    try {
      const booking = await createBooking(username, slug, {
        inviteeName: name,
        inviteeEmail: email,
        startTime: selectedStartTime,
        notes,
      });

      const query = new URLSearchParams({
        bookingId: String(booking.id),
        startTime: String(booking.startTime),
        endTime: String(booking.endTime),
        inviteeName: name,
        inviteeEmail: email,
        timezone: hostTimeZone,
      });

      router.push(`/${username}/${slug}/success?${query.toString()}`);
    } catch (err: unknown) {
      console.error('Error booking:', err);

      if (axios.isAxiosError(err) && err.response?.status === 409) {
        alert('This slot was just booked by someone else. Please choose another time.');
        router.replace(`/${username}/${slug}`);
        return;
      }

      alert('Failed to book meeting. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  if (error || !eventData || !dateParam || !timeParam) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-red-500 font-medium">{error || 'Invalid booking details'}</div>
      </div>
    );
  }

  const { eventType, user } = eventData;
  const selectedTime = new Date(timeParam);

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

              <div className="mt-6 space-y-3 text-[13px]">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-slate-500">event</span>
                  <span className="text-slate-700 font-medium">
                    {formatInTimeZone(selectedTime, hostTimeZone, 'h:mma')} - {formatInTimeZone(new Date(selectedTime.getTime() + eventType.duration * 60000), hostTimeZone, 'h:mma')}, {formatInTimeZone(selectedTime, hostTimeZone, 'EEEE, MMMM d, yyyy')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-slate-500">public</span>
                  <span className="text-slate-700 font-medium">{hostTimeZone}</span>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-200">
              </div>
            </div>

            {/* Right Panel - Form */}
            <div className="p-4 sm:p-6 md:col-span-2">
              <h2 className="text-[18px] font-bold text-slate-900 mb-6">Enter Details</h2>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Name */}
                <div>
                  <label className="block text-[13px] font-bold text-slate-900 mb-2">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg text-[14px] focus:outline-none focus:border-primary"
                    placeholder="Your name"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-[13px] font-bold text-slate-900 mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg text-[14px] focus:outline-none focus:border-primary"
                    placeholder="your@email.com"
                  />
                </div>

                {/* Add Guests */}
                <div>
                  <button
                    type="button"
                    className="inline-flex h-10 items-center rounded-full border border-primary px-4 text-[12px] font-bold text-primary transition-colors hover:bg-primary hover:text-white"
                  >
                    Add Guests
                  </button>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-[13px] font-bold text-slate-900 mb-2">
                    Please share anything that will help prepare for our meeting.
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg text-[14px] focus:outline-none focus:border-primary"
                    rows={4}
                    placeholder="Additional notes..."
                  />
                </div>

                {/* Terms */}
                <div className="text-[12px] text-slate-600">
                  By proceeding, you confirm that you have read and agree to CalClo&apos;s{' '}
                  <button type="button" className="text-primary font-bold hover:underline">
                    Terms of Use
                  </button>
                  {' '}and{' '}
                  <button type="button" className="text-primary font-bold hover:underline">
                    Privacy Notice
                  </button>
                  .
                </div>

                {/* Submit Button */}
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="min-h-11 w-full rounded-full bg-primary px-4 py-2 text-[14px] font-bold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {submitting ? 'Scheduling...' : 'Schedule Event'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
