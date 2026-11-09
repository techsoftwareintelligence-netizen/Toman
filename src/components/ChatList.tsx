import React, { useState } from 'react';
import { 
  Search, 
  Pin, 
  Check, 
  CheckCheck, 
  VolumeX, 
  Plus, 
  Sparkles, 
  X,
  MessageSquarePlus
} from 'lucide-react';
import { ChatThread, UserProfile } from '../types/chat';

interface ChatListProps {
  chats: ChatThread[];
  activeChatId: string | null;
  onSelectChat: (chatId: string) => void;
  currentUser: UserProfile;
  contacts: UserProfile[];
  onOpenNewChat: () => void;
}

export const ChatList: React.FC<ChatListProps> = ({
  chats,
  activeChatId,
  onSelectChat,
  currentUser,
  contacts,
  onOpenNewChat,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'unread' | 'groups'>('all');

  // Filter logic
  const filteredChats = chats.filter((chat) => {
    // Search query match
    const name = chat.isGroup ? chat.name || 'Group' : chat.members.find((m) => m.id !== currentUser.id)?.name || '';
    const lastMsgText = chat.lastMessage?.text || '';
    const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) || lastMsgText.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filterMode === 'unread') return chat.unreadCount > 0;
    if (filterMode === 'groups') return chat.isGroup;
    return true;
  });

  const pinnedChats = filteredChats.filter((c) => c.isPinned);
  const regularChats = filteredChats.filter((c) => !c.isPinned);

  const getChatDisplayName = (chat: ChatThread) => {
    if (chat.isGroup) return chat.name || 'Group Chat';
    const otherUser = chat.members.find((m) => m.id !== currentUser.id);
    return otherUser?.name || 'Unknown User';
  };

  const getChatDisplayAvatar = (chat: ChatThread) => {
    if (chat.isGroup) return chat.avatar || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&auto=format&fit=crop&q=80';
    const otherUser = chat.members.find((m) => m.id !== currentUser.id);
    return otherUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80';
  };

  const isOtherUserOnline = (chat: ChatThread) => {
    if (chat.isGroup) return false;
    const otherUser = chat.members.find((m) => m.id !== currentUser.id);
    return otherUser?.isOnline || false;
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border-r border-slate-800/80 overflow-hidden select-none">
      
      {/* Search & Header Section */}
      <div className="p-3.5 space-y-3 bg-slate-900 border-b border-slate-800/80">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search messages, contacts, or groups..."
            className="w-full h-10 pl-9 pr-8 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
          />
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-3 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Segmented Controls */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-lg border border-slate-800/60 text-xs">
          <button
            type="button"
            onClick={() => setFilterMode('all')}
            className={`flex-1 py-1.5 font-medium rounded-md transition-colors ${
              filterMode === 'all'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All ({chats.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('unread')}
            className={`flex-1 py-1.5 font-medium rounded-md transition-colors ${
              filterMode === 'unread'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Unread ({chats.filter((c) => c.unreadCount > 0).length})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('groups')}
            className={`flex-1 py-1.5 font-medium rounded-md transition-colors ${
              filterMode === 'groups'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Groups
          </button>
        </div>
      </div>

      {/* Online Contacts Horizontal Story Scroller */}
      <div className="p-3 bg-slate-950/40 border-b border-slate-800/60 overflow-x-auto no-scrollbar">
        <p className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase mb-2 px-1">
          Online Contacts
        </p>
        <div className="flex items-center gap-3">
          {/* New Story / Add */}
          <button
            type="button"
            onClick={onOpenNewChat}
            className="flex flex-col items-center gap-1 shrink-0 group"
          >
            <div className="w-12 h-12 rounded-full bg-slate-800 border-2 border-dashed border-slate-700 flex items-center justify-center text-slate-400 group-hover:border-emerald-400 group-hover:text-emerald-400 transition-colors">
              <Plus className="w-5 h-5" />
            </div>
            <span className="text-[10px] text-slate-400 truncate w-12 text-center group-hover:text-emerald-400">
              New Chat
            </span>
          </button>

          {/* Contact Avatars */}
          {contacts.map((contact) => (
            <button
              key={contact.id}
              type="button"
              onClick={() => {
                const existing = chats.find((c) => !c.isGroup && c.members.some((m) => m.id === contact.id));
                if (existing) {
                  onSelectChat(existing.id);
                } else {
                  onOpenNewChat();
                }
              }}
              className="flex flex-col items-center gap-1 shrink-0 group"
            >
              <div className="relative">
                <img
                  src={contact.avatar}
                  alt={contact.name}
                  className={`w-12 h-12 rounded-full object-cover border-2 transition-transform group-hover:scale-105 ${
                    contact.isOnline ? 'border-emerald-400 shadow-sm shadow-emerald-500/30' : 'border-slate-700'
                  }`}
                />
                {contact.isOnline && (
                  <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 rounded-full ring-2 ring-slate-900" />
                )}
              </div>
              <span className="text-[10px] font-medium text-slate-300 truncate w-14 text-center group-hover:text-emerald-400">
                {contact.name.split(' ')[0]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Conversations Feed */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-800/40">
        
        {/* Pinned Section */}
        {pinnedChats.length > 0 && (
          <div className="py-2">
            <div className="px-3 py-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <Pin className="w-3 h-3 text-emerald-400" />
              <span>Pinned Conversations</span>
            </div>
            {pinnedChats.map((chat) => (
              <ChatItemRow
                key={chat.id}
                chat={chat}
                isSelected={chat.id === activeChatId}
                name={getChatDisplayName(chat)}
                avatar={getChatDisplayAvatar(chat)}
                isOnline={isOtherUserOnline(chat)}
                onSelect={() => onSelectChat(chat.id)}
                currentUser={currentUser}
              />
            ))}
          </div>
        )}

        {/* Regular Chats Section */}
        <div className="py-2">
          {pinnedChats.length > 0 && regularChats.length > 0 && (
            <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              All Conversations
            </div>
          )}

          {filteredChats.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <MessageSquarePlus className="w-8 h-8 mx-auto mb-2 text-slate-600" />
              <p className="text-xs font-medium">No matching chats found</p>
              <button
                type="button"
                onClick={onOpenNewChat}
                className="mt-3 text-xs text-emerald-400 font-bold hover:underline"
              >
                Start a new conversation
              </button>
            </div>
          ) : (
            regularChats.map((chat) => (
              <ChatItemRow
                key={chat.id}
                chat={chat}
                isSelected={chat.id === activeChatId}
                name={getChatDisplayName(chat)}
                avatar={getChatDisplayAvatar(chat)}
                isOnline={isOtherUserOnline(chat)}
                onSelect={() => onSelectChat(chat.id)}
                currentUser={currentUser}
              />
            ))
          )}
        </div>
      </div>

    </div>
  );
};

interface ChatItemRowProps {
  chat: ChatThread;
  isSelected: boolean;
  name: string;
  avatar: string;
  isOnline: boolean;
  onSelect: () => void;
  currentUser: UserProfile;
}

const ChatItemRow: React.FC<ChatItemRowProps> = ({
  chat,
  isSelected,
  name,
  avatar,
  isOnline,
  onSelect,
  currentUser,
}) => {
  const lastMsg = chat.lastMessage;
  const isMine = lastMsg?.senderId === currentUser.id;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full px-3.5 py-3 flex items-center gap-3 text-left transition-all relative ${
        isSelected
          ? 'bg-slate-800/80 border-l-4 border-emerald-400'
          : 'hover:bg-slate-800/40 active:bg-slate-800/60'
      }`}
    >
      {/* Avatar Container */}
      <div className="relative shrink-0">
        <img
          src={avatar}
          alt={name}
          className="w-12 h-12 rounded-full object-cover border border-slate-700/80 shadow-sm"
        />
        {isOnline && (
          <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 rounded-full ring-2 ring-slate-900" />
        )}
      </div>

      {/* Middle Text Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1 mb-0.5">
          <h4 className="text-sm font-semibold text-slate-100 truncate flex items-center gap-1.5">
            <span>{name}</span>
            {chat.isMuted && <VolumeX className="w-3 h-3 text-slate-500 shrink-0" />}
          </h4>
          <span className="text-[11px] font-mono text-slate-500 shrink-0">
            {lastMsg?.timestamp || ''}
          </span>
        </div>

        <div className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-1 text-xs text-slate-400 truncate">
            {isMine && (
              <span className="shrink-0 text-emerald-400">
                {lastMsg?.status === 'read' ? (
                  <CheckCheck className="w-3.5 h-3.5" />
                ) : (
                  <Check className="w-3.5 h-3.5 text-slate-400" />
                )}
              </span>
            )}
            <span className="truncate">
              {lastMsg?.type === 'voice'
                ? `🎵 Voice note (${lastMsg.voiceDuration || '0:30'})`
                : lastMsg?.text || 'No messages yet'}
            </span>
          </div>

          {/* Unread Counter Badge */}
          {chat.unreadCount > 0 && (
            <span className="shrink-0 bg-emerald-500 text-slate-950 font-bold text-[11px] px-1.5 py-0.5 rounded-full min-w-[20px] text-center shadow-sm">
              {chat.unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
};
