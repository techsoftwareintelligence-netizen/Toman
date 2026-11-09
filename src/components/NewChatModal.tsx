import React, { useState } from 'react';
import { X, Users, User, Search, Plus, Check } from 'lucide-react';
import { UserProfile } from '../types/chat';

interface NewChatModalProps {
  contacts: UserProfile[];
  currentUser: UserProfile;
  onClose: () => void;
  onCreateDirectChat: (targetUser: UserProfile) => void;
  onCreateGroupChat: (name: string, memberIds: string[]) => void;
}

export const NewChatModal: React.FC<NewChatModalProps> = ({
  contacts,
  currentUser,
  onClose,
  onCreateDirectChat,
  onCreateGroupChat,
}) => {
  const [mode, setMode] = useState<'direct' | 'group'>('direct');
  const [searchQuery, setSearchQuery] = useState('');
  const [groupName, setGroupName] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);

  const filteredContacts = contacts.filter((c) =>
    c.id !== currentUser.id &&
    (c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.phone.includes(searchQuery))
  );

  const toggleSelectMember = (id: string) => {
    setSelectedMemberIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim() || selectedMemberIds.length === 0) return;
    onCreateGroupChat(groupName.trim(), selectedMemberIds);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
          <h3 className="text-base font-bold text-white">Start New Conversation</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher */}
        <div className="grid grid-cols-2 p-1 bg-slate-950 rounded-xl border border-slate-800 my-3 shrink-0 text-xs">
          <button
            type="button"
            onClick={() => setMode('direct')}
            className={`py-2 rounded-lg font-semibold flex items-center justify-center gap-1.5 ${
              mode === 'direct' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-400'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Direct Message</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('group')}
            className={`py-2 rounded-lg font-semibold flex items-center justify-center gap-1.5 ${
              mode === 'group' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-400'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>New Group</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative mb-3 shrink-0">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search contacts..."
            className="w-full h-10 pl-9 pr-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
        </div>

        {/* Group Name input if mode === group */}
        {mode === 'group' && (
          <div className="mb-3 shrink-0">
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Enter Group Name (e.g. Design Sync)"
              className="w-full h-10 px-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>
        )}

        {/* Contact List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 pr-1">
          {filteredContacts.map((contact) => {
            const isSelected = selectedMemberIds.includes(contact.id);

            return (
              <div
                key={contact.id}
                onClick={() => {
                  if (mode === 'direct') {
                    onCreateDirectChat(contact);
                    onClose();
                  } else {
                    toggleSelectMember(contact.id);
                  }
                }}
                className={`p-2.5 rounded-xl flex items-center justify-between cursor-pointer transition-colors ${
                  isSelected ? 'bg-slate-800/80 border border-emerald-500/40' : 'hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <img
                    src={contact.avatar}
                    alt={contact.name}
                    className="w-10 h-10 rounded-full object-cover border border-slate-700"
                  />
                  <div>
                    <h4 className="text-xs sm:text-sm font-semibold text-white">{contact.name}</h4>
                    <p className="text-[11px] text-slate-400">{contact.status || contact.phone}</p>
                  </div>
                </div>

                {mode === 'group' && (
                  <div className={`w-5 h-5 rounded-md border flex items-center justify-center ${
                    isSelected ? 'bg-emerald-500 border-emerald-500 text-slate-950' : 'border-slate-700'
                  }`}>
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Create Group Action Button */}
        {mode === 'group' && (
          <div className="pt-3 mt-2 border-t border-slate-800 shrink-0">
            <button
              type="button"
              onClick={handleCreateGroup}
              disabled={!groupName.trim() || selectedMemberIds.length === 0}
              className="w-full h-11 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>Create Group ({selectedMemberIds.length} Members)</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
