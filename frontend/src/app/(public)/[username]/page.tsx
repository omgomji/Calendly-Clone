'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { getPublicProfile } from '@/lib/api';
import Link from 'next/link';
import type { EventType } from '@/types/event-types';
import type { PublicUser } from '@/types/public';

export default function UserLandingPage() {
  const { username } = useParams<{ username: string }>();
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [userData, setUserData] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const data = await getPublicProfile(username);
        setUserData(data.user);
        // Only show event types that are active
        setEventTypes((data.eventTypes || []).filter((et) => et.isActive !== false));
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError('User not found');
      } finally {
        setLoading(false);
      }
    };

    if (username) fetchUserData();
  }, [username]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-red-500 font-medium">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <span className="text-[12px] font-medium text-slate-500 uppercase tracking-wide">
            CalClo
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
        {/* Username Header */}
        <div className="mb-8">
          <h1 className="text-[32px] font-bold text-slate-900 sm:text-[40px] lg:text-[48px]">{userData?.name || username}</h1>
          <p className="mt-3 max-w-2xl text-[15px] text-slate-600 sm:text-[16px]">
            Welcome to my scheduling page. Please follow the instructions to add an event to my calendar.
          </p>
        </div>

        {/* Event Types Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {eventTypes.map((event) => (
            <Link key={event.id} href={`/${username}/${event.slug}`}>
              <div className="bg-white rounded-lg border border-slate-200 p-6 hover:shadow-lg transition-shadow cursor-pointer group">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="h-6 w-6 rounded-full bg-purple-500 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="text-[18px] font-bold text-slate-900 group-hover:text-primary transition-colors">
                        {event.title}
                      </h3>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-slate-400 group-hover:text-slate-600 transition-colors">
                    chevron_right
                  </span>
                </div>
                {event.description && (
                  <p className="text-[14px] text-slate-600 mt-2 ml-9">
                    {event.description}
                  </p>
                )}
                <div className="flex items-center gap-1 text-[13px] text-slate-500 mt-3 ml-9">
                  <span className="material-symbols-outlined text-[16px]">schedule</span>
                  {event.duration} min
                </div>
              </div>
            </Link>
          ))}
        </div>

        {eventTypes.length === 0 && (
          <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
            <p className="text-slate-600">No event types available</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-12 py-6 border-t border-slate-200 text-center text-[12px] text-slate-500">
      </div>
    </div>
  );
}
