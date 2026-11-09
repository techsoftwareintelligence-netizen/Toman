import { 
  collection, 
  doc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  serverTimestamp, 
  getDocs,
  getDoc
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { ChatThread, ChatMessage, UserProfile } from '../types/chat';

// Create or Get 1-on-1 Direct Chat Thread
export async function createOrGetDirectChat(
  currentUser: UserProfile, 
  targetUser: UserProfile
): Promise<string> {
  const currentUserId = currentUser?.id || currentUser?.uid;
  const targetUserId = targetUser?.id || targetUser?.uid;

  if (!currentUserId || !targetUserId) {
    console.warn('createOrGetDirectChat missing userId:', { currentUserId, targetUserId });
    throw new Error('Invalid user ID for direct chat creation');
  }

  const chatsRef = collection(db, 'chats');
  
  // Find existing chat where both memberIds exist
  const q = query(chatsRef, where('isGroup', '==', false), where('memberIds', 'array-contains', currentUserId));
  
  try {
    const querySnap = await getDocs(q);
    let existingChatId: string | null = null;

    querySnap.forEach((docSnap) => {
      const data = docSnap.data();
      if (Array.isArray(data.memberIds) && data.memberIds.includes(targetUserId)) {
        existingChatId = docSnap.id;
      }
    });

    if (existingChatId) {
      return existingChatId;
    }

    // Create new direct chat
    const newChatRef = doc(chatsRef);
    const newChatId = newChatRef.id;

    await setDoc(newChatRef, {
      id: newChatId,
      isGroup: false,
      memberIds: [currentUserId, targetUserId],
      createdBy: currentUserId,
      lastMessageText: `Encrypted conversation started`,
      lastMessageTimestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      lastMessageSenderId: currentUserId,
      updatedAt: new Date().toISOString(),
    });

    return newChatId;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'chats');
  }
}

// Create Group Chat Thread
export async function createGroupChat(
  currentUser: UserProfile, 
  groupName: string, 
  memberUsers: UserProfile[],
  avatar?: string
): Promise<string> {
  const currentUserId = currentUser?.id || currentUser?.uid;
  if (!currentUserId) throw new Error('Invalid creator user ID');

  const chatsRef = collection(db, 'chats');
  const newChatRef = doc(chatsRef);
  const newChatId = newChatRef.id;
  const memberIds = [currentUserId, ...memberUsers.map(u => u.id || u.uid).filter(Boolean)];

  try {
    await setDoc(newChatRef, {
      id: newChatId,
      isGroup: true,
      name: groupName,
      avatar: avatar || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&auto=format&fit=crop&q=80',
      memberIds,
      createdBy: currentUserId,
      lastMessageText: `Group "${groupName}" created`,
      lastMessageTimestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      lastMessageSenderId: currentUserId,
      updatedAt: new Date().toISOString(),
    });

    return newChatId;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'chats');
  }
}

// Subscribe to User's Chat Threads Real-Time
export function subscribeToUserChats(
  userId: string | undefined, 
  callback: (threads: ChatThread[]) => void
) {
  const currentUid = auth.currentUser?.uid || userId;
  if (!currentUid) {
    console.warn('subscribeToUserChats skipped: no active authenticated uid');
    callback([]);
    return () => {};
  }

  const chatsRef = collection(db, 'chats');
  const q = query(chatsRef, where('memberIds', 'array-contains', currentUid));

  return onSnapshot(
    q,
    (snapshot) => {
      const threads: ChatThread[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        threads.push({
          id: docSnap.id,
          isGroup: data.isGroup || false,
          name: data.name,
          avatar: data.avatar,
          members: [],
          unreadCount: 0,
          isPinned: false,
          lastMessage: {
            id: 'lm_' + docSnap.id,
            senderId: data.lastMessageSenderId || '',
            text: data.lastMessageText || '',
            timestamp: data.lastMessageTimestamp || '',
            status: 'delivered',
            type: 'text',
          },
          memberIds: data.memberIds || [],
        } as unknown as ChatThread);
      });
      callback(threads);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'chats');
    }
  );
}

// Subscribe to Messages in a Chat Thread
export function subscribeToChatMessages(
  chatId: string | undefined,
  callback: (messages: ChatMessage[]) => void
) {
  if (!chatId) {
    callback([]);
    return () => {};
  }

  const messagesRef = collection(db, 'chats', chatId, 'messages');

  return onSnapshot(
    messagesRef,
    (snapshot) => {
      const msgList: ChatMessage[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        msgList.push({
          id: docSnap.id,
          senderId: data.senderId,
          text: data.isDeleted ? '🚫 Message deleted' : data.text,
          timestamp: data.timestamp || 'Just now',
          status: data.status || 'sent',
          type: data.type || 'text',
          mediaUrl: data.mediaUrl,
          voiceDuration: data.voiceDuration,
          replyToId: data.replyToId,
          reactions: data.reactions || [],
        } as ChatMessage);
      });

      // Sort client-side by ID timestamp to prevent missing index errors
      msgList.sort((a, b) => a.id.localeCompare(b.id));

      callback(msgList);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, `chats/${chatId}/messages`);
    }
  );
}

// Send Message
export async function sendChatMessage(
  chatId: string,
  senderUser: UserProfile,
  text: string,
  type: 'text' | 'image' | 'video' | 'audio' | 'voice' | 'file' = 'text',
  mediaUrl?: string,
  replyToId?: string
) {
  const senderId = senderUser?.id || senderUser?.uid;
  if (!chatId || !senderId) {
    console.warn('sendChatMessage missing parameters:', { chatId, senderId });
    return;
  }

  const messagesRef = collection(db, 'chats', chatId, 'messages');
  const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const msgData = {
    senderId,
    senderName: senderUser.name || 'Friend',
    senderAvatar: senderUser.avatar || '',
    text,
    type,
    mediaUrl: mediaUrl || null,
    replyToId: replyToId || null,
    status: 'sent',
    timestamp: nowStr,
    createdAt: new Date().toISOString(),
  };

  try {
    const newMsgDoc = await addDoc(messagesRef, msgData);

    const chatDocRef = doc(db, 'chats', chatId);
    await updateDoc(chatDocRef, {
      lastMessageText: type === 'image' ? '📷 Photo' : type === 'audio' ? '🎵 Voice message' : text,
      lastMessageTimestamp: nowStr,
      lastMessageSenderId: senderId,
      updatedAt: new Date().toISOString(),
    });

    return newMsgDoc.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `chats/${chatId}/messages`);
  }
}

// Delete Message (Sender or Admin)
export async function deleteChatMessage(chatId: string, messageId: string) {
  if (!chatId || !messageId) return;
  const msgDocRef = doc(db, 'chats', chatId, 'messages', messageId);
  try {
    await updateDoc(msgDocRef, {
      isDeleted: true,
      text: '🚫 Message deleted',
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `chats/${chatId}/messages/${messageId}`);
  }
}

// Add Emoji Reaction to Message
export async function addReactionToMessage(chatId: string, messageId: string, emoji: string, userId: string) {
  if (!chatId || !messageId || !userId) return;
  const msgDocRef = doc(db, 'chats', chatId, 'messages', messageId);

  try {
    const snap = await getDoc(msgDocRef);
    if (!snap.exists()) return;

    const currentReactions = snap.data().reactions || [];
    const existingIndex = currentReactions.findIndex((r: any) => r.emoji === emoji);

    let updatedReactions;
    if (existingIndex > -1) {
      updatedReactions = [...currentReactions];
      updatedReactions[existingIndex].count += 1;
    } else {
      updatedReactions = [...currentReactions, { emoji, count: 1, users: [userId] }];
    }

    await updateDoc(msgDocRef, { reactions: updatedReactions });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `chats/${chatId}/messages/${messageId}`);
  }
}

// Real-Time Typing Indicator
export async function setTypingIndicator(chatId: string, userId: string, username: string, isTyping: boolean) {
  if (!chatId || !userId) return;
  const typingDocRef = doc(db, 'chats', chatId, 'typing', userId);
  try {
    await setDoc(typingDocRef, {
      userId,
      username,
      isTyping,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.warn('Typing indicator update note:', error);
  }
}

// Subscribe to Typing Status
export function subscribeToTypingStatus(
  chatId: string | undefined, 
  currentUserId: string | undefined, 
  callback: (typingUsernames: string[]) => void
) {
  if (!chatId || !currentUserId) {
    callback([]);
    return () => {};
  }

  const typingRef = collection(db, 'chats', chatId, 'typing');

  return onSnapshot(
    typingRef,
    (snapshot) => {
      const activeTyping: string[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.userId !== currentUserId && data.isTyping) {
          activeTyping.push(data.username || 'Someone');
        }
      });
      callback(activeTyping);
    },
    (error) => {
      console.warn('Typing listener warning:', error);
    }
  );
}
