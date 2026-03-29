"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getContacts, createContact, deleteContact } from '@/lib/api';
import type { Contact } from '@/types/contact';
import ContactDrawer, { type ContactDrawerData } from '@/components/ContactDrawer';

export default function ContactsPage() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const data = await getContacts();
      setContacts(data);
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveContact = async (data: ContactDrawerData) => {
    try {
      setSaving(true);
      const newContact = await createContact(data);
      setContacts((prev) => [newContact, ...prev]);
      setDrawerOpen(false);
    } catch (error) {
      console.error('Error saving contact:', error);
      alert('Failed to save contact. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveContact = async (id: number) => {
    try {
      setDeleting(id);
      await deleteContact(id);
      setContacts((prev) => prev.filter((contact) => contact.id !== id));
    } catch (error) {
      console.error('Error deleting contact:', error);
      alert('Failed to delete contact. Please try again.');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <>
      <div className="pb-16 pt-4">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[20px] font-bold text-slate-900">Contacts</h1>
            <p className="mt-1 text-[12px] text-slate-500">Manage people you&apos;ve met through scheduling.</p>
          </div>

          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="inline-flex h-9 items-center gap-2 rounded-full bg-primary px-4 text-[12px] font-semibold text-white hover:opacity-90"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            Add contact
          </button>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="inline-flex h-8 items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
          >
            <span className="material-symbols-outlined text-[14px] text-slate-500">upload</span>
            Import
          </button>
          <button
            type="button"
            className="inline-flex h-8 items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
          >
            <span className="material-symbols-outlined text-[14px] text-slate-500">sell</span>
            Tags
          </button>
          <button
            type="button"
            className="inline-flex h-8 items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
          >
            <span className="material-symbols-outlined text-[14px] text-slate-500">filter_list</span>
            Filter
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center rounded-md border border-slate-200 bg-white p-10">
            <div className="h-7 w-7 animate-spin rounded-full border-b-2 border-primary" />
          </div>
        ) : contacts.length === 0 ? (
          <div className="max-w-[980px] rounded-md border border-slate-200 bg-white p-10 text-center">
            <div className="mx-auto mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500">
              <span className="material-symbols-outlined text-[20px]">inbox</span>
            </div>
            <h2 className="text-[14px] font-semibold text-slate-900">No contacts yet</h2>
            <p className="mt-1 text-[11px] text-slate-500">
              Contacts will appear here after someone books with you or when you import them.
            </p>

            <div className="mt-4">
              <Link
                href="/"
                className="inline-flex h-8 items-center rounded-full border border-slate-300 px-3 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
              >
                Go to Scheduling
              </Link>
            </div>
          </div>
        ) : (
          <div className="max-w-[980px] overflow-hidden rounded-md border border-slate-200 bg-white">
            <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              {contacts.length} Contact{contacts.length === 1 ? '' : 's'}
            </div>

            <ul className="divide-y divide-slate-200">
              {contacts.map((contact) => (
                <li key={contact.id} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-semibold text-slate-900">{contact.name}</p>
                      <p className="mt-0.5 text-[12px] text-slate-600">{contact.email}</p>
                      {contact.phone ? <p className="mt-0.5 text-[12px] text-slate-600">{contact.phone}</p> : null}
                      {contact.note ? <p className="mt-1 text-[12px] text-slate-500">{contact.note}</p> : null}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveContact(contact.id)}
                      disabled={deleting === contact.id}
                      className="inline-flex h-7 w-7 items-center justify-center rounded text-slate-500 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                      aria-label="Remove contact"
                      title="Remove contact"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <ContactDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSave={handleSaveContact}
      />
    </>
  );
}
