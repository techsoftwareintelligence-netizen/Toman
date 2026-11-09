export interface UserProfile {
  id: string;
  uid?: string;
  username: string;
  name: string;
  phone: string;
  email: string;
  avatar: string;
  status: string;
  isOnline: boolean;
  role?: 'admin' | 'user';
  isDisabled?: boolean;
  lastSeen?: string;
  bio?: string;
  createdAt?: string;
}

export interface MessageReaction {
  emoji: string;
  count: number;
  users: string[];
}

export interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
  status: 'sending' | 'sent' | 'delivered' | 'seen' | 'read';
  type: 'text' | 'image' | 'video' | 'audio' | 'voice' | 'file';
  mediaUrl?: string;
  voiceDuration?: string;
  replyToId?: string;
  reactions?: MessageReaction[];
  isDeleted?: boolean;
}

export interface ChatThread {
  id: string;
  isGroup: boolean;
  name?: string;
  avatar?: string;
  members: UserProfile[];
  memberIds?: string[];
  lastMessage?: ChatMessage;
  unreadCount: number;
  isPinned?: boolean;
  isMuted?: boolean;
  customWallpaper?: string;
}

export interface CallLog {
  id: string;
  contact: UserProfile;
  type: 'incoming' | 'outgoing' | 'missed';
  isVideo: boolean;
  timestamp: string;
  duration?: string;
}

export type ActiveTab = 'chats' | 'calls' | 'contacts' | 'settings';

export interface AuthState {
  isAuthenticated: boolean;
  user: UserProfile | null;
  method: 'phone' | 'email' | 'biometric' | 'guest' | 'username';
}
