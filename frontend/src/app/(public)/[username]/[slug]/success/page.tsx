'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { getPublicEventDetails } from '@/lib/api';
import { formatInTimeZone } from 'date-fns-tz';
import type { PublicEventData } from '@/types/public';

export default function SuccessPage() {
  const { username, slug } = useParams<{ username: string; slug: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [eventData, setEventData] = useState<PublicEventData | null>(null);
  const [loading, setLoading] = useState(true);

  const bookingId = searchParams.get('bookingId');
  const startTime = searchParams.get('startTime');
  const endTime = searchParams.get('endTime');
  const inviteeName = searchParams.get('inviteeName');
  const inviteeEmail = searchParams.get('inviteeEmail');
  const timezone = searchParams.get('timezone') || Intl.DateTimeFormat().resolvedOptions().timeZone;

  const startDate = startTime ? new Date(startTime) : null;
  const endDate = endTime ? new Date(endTime) : null;
  const hasMeetingDetails = Boolean(startDate && endDate && !Number.isNaN(startDate.getTime()) && !Number.isNaN(endDate.getTime()));

  useEffect(() => {
    const fetchEventData = async () => {
      try {
        const data = await getPublicEventDetails(username, slug);
        setEventData(data);
      } catch (err) {
        console.error('Error fetching event:', err);
      } finally {
        setLoading(false);
      }
    };
    if (username && slug) fetchEventData();
  }, [username, slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <span className="text-[12px] font-medium text-slate-500 uppercase">CalClo</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-200 p-6 text-center sm:p-10 lg:p-12">
          {/* Success Icon */}
          <div className="mb-6 flex justify-center">
            <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full">
              <span className="material-symbols-outlined text-[32px] text-green-600">check_circle</span>
            </div>
          </div>

          {/* Success Message */}
          <h1 className="mb-3 text-[26px] font-bold text-slate-900 sm:text-[32px]">You&apos;re scheduled</h1>

          <p className="text-[16px] text-slate-600 mb-6">
            {eventData ? `A confirmation email will be sent to the email address provided. ${eventData.user.name} will receive an invitation that they can accept to add this meeting to their calendar.` : 'Your meeting has been successfully scheduled.'}
          </p>

          {hasMeetingDetails && (
            <div className="mb-8 rounded-md border border-slate-200 bg-slate-50 p-4 text-left">
              <h2 className="text-[14px] font-semibold text-slate-900">Meeting details</h2>
              <p className="mt-2 text-[13px] text-slate-700">
                {eventData?.eventType?.title || 'Meeting'} with {eventData?.user?.name || 'Host'}
              </p>
              <p className="mt-1 text-[12px] text-slate-600">
                {formatInTimeZone(startDate as Date, timezone, 'EEEE, MMMM d, yyyy')} at {formatInTimeZone(startDate as Date, timezone, 'h:mma')} - {formatInTimeZone(endDate as Date, timezone, 'h:mma')} ({timezone})
              </p>
              {inviteeName && <p className="mt-1 text-[12px] text-slate-600">Invitee: {inviteeName}</p>}
              {inviteeEmail && <p className="mt-1 text-[12px] text-slate-600">Email: {inviteeEmail}</p>}
              {bookingId && <p className="mt-1 text-[11px] text-slate-500">Booking ID: {bookingId}</p>}
            </div>
          )}

          {/* CTA Buttons */}
          <div className="flex items-center justify-center gap-3 flex-wrap mb-6">
            <button
              onClick={() => router.push(`/${username}`)}
              className="inline-flex min-h-11 items-center rounded-full border border-slate-200 px-6 py-2 text-[14px] font-bold text-slate-700 transition-colors hover:bg-slate-50"
            >
              Schedule another event
            </button>
            <button
              onClick={() => {
                const link = `${window.location.origin}/${username}/${slug}`;
                navigator.clipboard.writeText(link);
                alert('Link copied to clipboard!');
              }}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-primary px-6 py-2 text-[14px] font-bold text-primary transition-colors hover:bg-primary hover:text-white"
            >
              <span className="material-symbols-outlined text-[16px]">link</span>
              Share booking link
            </button>
          </div>

          {/* Calendar Integration */}
          <div className="mt-8 pt-6 border-t border-slate-200">
            <p className="text-[12px] text-slate-600 mb-3">Add to your calendar:</p>
            <div className="flex items-center justify-center gap-3">
              <button className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 transition-colors hover:bg-slate-50">
                <span className="material-symbols-outlined text-[18px] text-slate-600">calendar_month</span>
              </button>
              <button className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 transition-colors hover:bg-slate-50">
                <span className="material-symbols-outlined text-[18px] text-slate-600">mail</span>
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-slate-200">
          </div>
        </div>
      </div>
    </div>
  );
}
