import axios from 'axios';
import type { AvailabilityPayload, AvailabilitySchedule } from '@/types/availability';
import type { BookingPayload, CreatedBooking, MeetingRecord } from '@/types/booking';
import type { EventType, EventTypePayload } from '@/types/event-types';
import type { PublicEventData, PublicProfileData, PublicSlotItem, RescheduleDetailsResponse } from '@/types/public';
import type { Contact, ContactPayload } from '@/types/contact';

const resolveApiBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;

  if (typeof window !== 'undefined') {
    return `http://${window.location.hostname}:5000/api`;
  }

  return 'http://localhost:5000/api';
};

const api = axios.create({
  baseURL: resolveApiBaseUrl(),
});

export const getEventTypes = async (): Promise<EventType[]> => {
  const response = await api.get<EventType[]>('/event-types');
  return response.data;
};

export const createEventType = async (data: EventTypePayload): Promise<EventType> => {
  const response = await api.post<EventType>('/event-types', data);
  return response.data;
};

export const updateEventType = async (id: number, data: EventTypePayload): Promise<EventType> => {
  const response = await api.put<EventType>(`/event-types/${id}`, data);
  return response.data;
};

export const deleteEventType = async (id: number) => {
  const response = await api.delete(`/event-types/${id}`);
  return response.data;
};

export const getMeetings = async (status?: 'upcoming' | 'past'): Promise<MeetingRecord[]> => {
  const response = await api.get<MeetingRecord[]>('/bookings', {
    params: status ? { status } : undefined,
  });
  return response.data;
};

export const cancelMeeting = async (id: number): Promise<MeetingRecord> => {
  const response = await api.post<MeetingRecord>(`/bookings/${id}/cancel`);
  return response.data;
};

export const getAvailability = async (): Promise<AvailabilitySchedule> => {
  const response = await api.get<AvailabilitySchedule>('/availability');
  return response.data;
};

export const updateAvailability = async (data: AvailabilityPayload): Promise<AvailabilitySchedule> => {
  const response = await api.put<AvailabilitySchedule>('/availability', data);
  return response.data;
};

export const getPublicProfile = async (username: string): Promise<PublicProfileData> => {
  const response = await api.get<PublicProfileData>(`/public/${username}`);
  return response.data;
};

export const getPublicEventTypes = getPublicProfile;

export const getPublicEventDetails = async (username: string, slug: string): Promise<PublicEventData> => {
  const response = await api.get<PublicEventData>(`/public/${username}/${slug}`);
  return response.data;
};

export const getPublicSlots = async (
  username: string,
  slug: string,
  date: string
): Promise<PublicSlotItem[]> => {
  const response = await api.get<PublicSlotItem[]>(`/public/${username}/${slug}/slots`, {
    params: { date },
  });
  return response.data;
};

export const createBooking = async (
  username: string,
  slug: string,
  data: BookingPayload
): Promise<CreatedBooking> => {
  const response = await api.post<CreatedBooking>(`/public/${username}/${slug}/book`, data);
  return response.data;
};

export const getRescheduleDetails = async (uid: string): Promise<RescheduleDetailsResponse> => {
  const response = await api.get<RescheduleDetailsResponse>(`/public/reschedule/${uid}/details`);
  return response.data;
};

export const rescheduleBooking = async (uid: string, startTime: string): Promise<CreatedBooking> => {
  const response = await api.post<CreatedBooking>(`/public/reschedule/${uid}`, { startTime });
  return response.data;
};

export const getContacts = async (): Promise<Contact[]> => {
  const response = await api.get<Contact[]>('/contacts');
  return response.data;
};

export const createContact = async (data: ContactPayload): Promise<Contact> => {
  const response = await api.post<Contact>('/contacts', data);
  return response.data;
};

export const updateContact = async (id: number, data: ContactPayload): Promise<Contact> => {
  const response = await api.put<Contact>(`/contacts/${id}`, data);
  return response.data;
};

export const deleteContact = async (id: number) => {
  const response = await api.delete(`/contacts/${id}`);
  return response.data;
};

export default api;
