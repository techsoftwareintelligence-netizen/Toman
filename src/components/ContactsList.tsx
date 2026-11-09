import React, { useState } from 'react';
import { Search, MessageSquare, Phone, UserPlus, Shield } from 'lucide-react';
import { UserProfile } from '../types/chat';

interface ContactsListProps {
  contacts: UserProfile[];
  onStartChatWithUser: (user: UserProfile) => void;
  onStartCallWithUser: (user: UserProfile) => void;
}

export const ContactsList: React.FC<ContactsListProps> = ({
  contacts,
  onStartChatWithUser,
  onStartCallWithUser,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOnlineOnly, setFilterOnlineOnly] = useState(false);

  const filteredContacts = contacts.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (filterOnlineOnly) return c.isOnline;
    return true;
  });

  return (
    <div className="flex flex-col h-full bg-slate-900 overflow-hidden select-none">
      
      {/* Search & Header Section */}
      <div className="p-3.5 space-y-3 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white">Contacts ({contacts.length})</h2>
          <button
            type="button"
            onClick={() => setFilterOnlineOnly(!filterOnlineOnly)}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors ${
              filterOnlineOnly
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                : 'bg-slate-800 text-slate-400 border-slate-700/60 hover:text-slate-200'
            }`}
          >
            {filterOnlineOnly ? 'Showing Online' : 'Filter Online'}
          </button>
        </div>

        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, phone or email..."
            className="w-full h-10 pl-9 pr-8 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          />
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
        </div>
      </div>

      {/* Invite Friends Banner */}
      <div className="p-3.5 bg-gradient-to-r from-emerald-950/40 to-teal-950/40 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400">
            <UserPlus className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">Invite Friends to TOMAN</h4>
            <p className="text-[10px] text-slate-400">Share your encrypted invite link</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => alert('TOMAN invite link copied to clipboard! (toman.app/invite/alex-rivers)')}
          className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-sm transition-all"
        >
          Share Link
        </button>
      </div>

      {/* Contact List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-800/40">
        {filteredContacts.map((contact) => (
          <div
            key={contact.id}
            className="p-3.5 flex items-center justify-between hover:bg-slate-800/40 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <img
                  src={contact.avatar}
                  alt={contact.name}
                  className="w-11 h-11 rounded-full object-cover border border-slate-700"
                />
                {contact.isOnline && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-slate-900" />
                )}
              </div>

              <div>
                <h4 className="text-xs sm:text-sm font-semibold text-slate-100 flex items-center gap-1.5">
                  <span>{contact.name}</span>
                </h4>
                <p className="text-[11px] text-slate-400 truncate max-w-[180px]">
                  {contact.status || contact.bio || contact.phone}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onStartChatWithUser(contact)}
                className="w-9 h-9 rounded-full bg-slate-950 border border-slate-800 text-emerald-400 hover:bg-emerald-500/20 flex items-center justify-center transition-colors"
                title="Message"
              >
                <MessageSquare className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => onStartCallWithUser(contact)}
                className="w-9 h-9 rounded-full bg-slate-950 border border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white flex items-center justify-center transition-colors"
                title="Voice Call"
              >
                <Phone className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
