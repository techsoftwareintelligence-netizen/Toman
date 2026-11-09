import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, testFirestoreConnection } from './lib/firebase';
import { SplashScreen } from './components/SplashScreen';
import { LoginScreen } from './components/LoginScreen';
import { HeaderBar } from './components/HeaderBar';
import { TabBar } from './components/TabBar';
import { ChatList } from './components/ChatList';
import { ChatConversation } from './components/ChatConversation';
import { CallsList } from './components/CallsList';
import { ContactsList } from './components/ContactsList';
import { SettingsView } from './components/SettingsView';
import { AdminDashboard } from './components/AdminDashboard';
import { NewChatModal } from './components/NewChatModal';
import { CallActiveModal } from './components/CallActiveModal';
import { IncomingCallModal } from './components/IncomingCallModal';

import { 
  TomanUser, 
  bootstrapInitialAdmin, 
  logoutUser, 
  subscribeToUsers 
} from './services/userService';
import { 
  createOrGetDirectChat, 
  createGroupChat, 
  subscribeToUserChats, 
  subscribeToChatMessages, 
  sendChatMessage, 
  deleteChatMessage, 
  addReactionToMessage, 
  setTypingIndicator, 
  subscribeToTypingStatus 
} from './services/chatService';
import { 
  webRTC, 
  subscribeToIncomingCalls, 
  ActiveCallData 
} from './services/webrtcService';

import { 
  UserProfile, 
  ChatThread, 
  ChatMessage, 
  CallLog, 
  ActiveTab 
} from './types/chat';
import { INITIAL_CALLS, DEMO_USERS } from './data/mockData';
import { translateTextWithGemini } from './utils/ai';

export default function App() {
  // App Boot & Auth States
  const [isInitializing, setIsInitializing] = useState(true);
  const [currentUser, setCurrentUser] = useState<TomanUser | null>(null);

  // Layout View Modes
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isMobileFrameView, setIsMobileFrameView] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('chats');
  const [isAdminDashboardOpen, setIsAdminDashboardOpen] = useState(false);

  // App Real-Time Collections Data
  const [usersList, setUsersList] = useState<TomanUser[]>([]);
  const [chatsList, setChatsList] = useState<ChatThread[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [activeMessages, setActiveMessages] = useState<ChatMessage[]>([]);
  const [activeTypingUsers, setActiveTypingUsers] = useState<string[]>([]);
  const [callsList, setCallsList] = useState<CallLog[]>([]);

  // Modals state
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [incomingCallData, setIncomingCallData] = useState<ActiveCallData | null>(null);
  const [activeCallInfo, setActiveCallInfo] = useState<{
    isOpen: boolean;
    contactName: string;
    isVideo: boolean;
    callId?: string;
  } | null>(null);

  // Expose global callback for SettingsView Admin trigger
  useEffect(() => {
    (window as any).openAdminDashboard = () => setIsAdminDashboardOpen(true);
  }, []);

  // 1. Bootstrapping & Firebase Auth Session Listener
  useEffect(() => {
    testFirestoreConnection();
    bootstrapInitialAdmin();

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Fetch user document from Firestore
          const userDocSnap = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDocSnap.exists()) {
            const uData = userDocSnap.data() as TomanUser;
            if (uData.isDisabled) {
              alert('Your account has been disabled by administrator.');
              await logoutUser(firebaseUser.uid);
              setCurrentUser(null);
            } else {
              setCurrentUser({ ...uData, id: firebaseUser.uid, uid: firebaseUser.uid });
            }
          } else {
            // Fallback user object
            setCurrentUser({
              id: firebaseUser.uid,
              uid: firebaseUser.uid,
              username: firebaseUser.email?.split('@')[0] || 'user',
              name: firebaseUser.displayName || 'TOMAN Friend',
              phone: '+1 (555) 019-2831',
              email: firebaseUser.email || '',
              role: 'user',
              isDisabled: false,
              avatar: '/src/assets/images/avatar_alex_1794242931602.jpg',
              status: 'Available for encrypted chat',
              isOnline: true,
            });
          }
        } catch (e) {
          console.warn('User profile fetch note:', e);
        }
      } else {
        setCurrentUser(null);
      }
      setIsInitializing(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. Subscribe to Users Directory
  useEffect(() => {
    const userId = currentUser?.id || currentUser?.uid;
    if (!userId) return;
    const unsub = subscribeToUsers((users) => {
      setUsersList(users);
      // Update currentUser if modified
      const matchedSelf = users.find((u) => u.id === userId || u.uid === userId);
      if (matchedSelf) {
        if (matchedSelf.isDisabled) {
          logoutUser(userId);
          setCurrentUser(null);
        } else {
          setCurrentUser(matchedSelf);
        }
      }
    });
    return () => unsub();
  }, [currentUser?.id, currentUser?.uid]);

  // 3. Subscribe to User's Real-Time Chats
  useEffect(() => {
    const userId = currentUser?.id || currentUser?.uid;
    if (!userId) return;
    const unsub = subscribeToUserChats(userId, (threads) => {
      setChatsList(threads);
      if (!activeChatId && threads.length > 0) {
        setActiveChatId(threads[0].id);
      }
    });
    return () => unsub();
  }, [currentUser?.id, currentUser?.uid]);

  // 4. Subscribe to Messages & Typing Status for Active Chat
  useEffect(() => {
    const userId = currentUser?.id || currentUser?.uid;
    if (!activeChatId || !userId) return;

    const unsubMsgs = subscribeToChatMessages(activeChatId, (msgs) => {
      setActiveMessages(msgs);
    });

    const unsubTyping = subscribeToTypingStatus(activeChatId, userId, (typingUsers) => {
      setActiveTypingUsers(typingUsers);
    });

    return () => {
      unsubMsgs();
      unsubTyping();
    };
  }, [activeChatId, currentUser?.id, currentUser?.uid]);

  // 5. Subscribe to Incoming WebRTC Calls
  useEffect(() => {
    const userId = currentUser?.id || currentUser?.uid;
    if (!userId) return;

    const unsub = subscribeToIncomingCalls(userId, (callData) => {
      setIncomingCallData(callData);
    });
    return () => unsub();
  }, [currentUser?.id, currentUser?.uid]);

  // 6. Tailwind Dark Mode Sync
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Logout Handler
  const handleLogout = async () => {
    if (currentUser) {
      await logoutUser(currentUser.id);
    }
    setCurrentUser(null);
    setIsAdminDashboardOpen(false);
  };

  // Send Message Handler
  const handleSendMessage = async (
    text: string, 
    type: 'text' | 'image' | 'video' | 'audio' | 'voice' | 'file' = 'text',
    mediaUrl?: string
  ) => {
    if (!activeChatId || !currentUser) return;
    await sendChatMessage(activeChatId, currentUser, text, type, mediaUrl);
  };

  // Add Emoji Reaction Handler
  const handleAddReaction = async (messageId: string, emoji: string) => {
    if (!activeChatId || !currentUser) return;
    await addReactionToMessage(activeChatId, messageId, emoji, currentUser.id);
  };

  // Start Direct Chat Handler
  const handleStartDirectChat = async (targetUser: UserProfile) => {
    if (!currentUser) return;
    const chatId = await createOrGetDirectChat(currentUser, targetUser);
    setActiveChatId(chatId);
    setActiveTab('chats');
  };

  // Create Group Chat Handler
  const handleCreateGroupChat = async (name: string, memberIds: string[]) => {
    if (!currentUser) return;
    const selectedUsers = usersList.filter((u) => memberIds.includes(u.id));
    const chatId = await createGroupChat(currentUser, name, selectedUsers);
    setActiveChatId(chatId);
    setActiveTab('chats');
  };

  // WebRTC Start Outgoing Call Handler
  const handleStartCall = async (isVideo: boolean, contactName?: string, targetUserId?: string) => {
    if (!currentUser) return;

    let targetUser: TomanUser | undefined;
    if (targetUserId) {
      targetUser = usersList.find((u) => u.id === targetUserId);
    } else if (activeChatId) {
      const activeChat = chatsList.find((c) => c.id === activeChatId);
      if (activeChat && activeChat.memberIds) {
        const otherId = activeChat.memberIds.find((id) => id !== currentUser.id);
        targetUser = usersList.find((u) => u.id === otherId);
      }
    }

    const name = contactName || targetUser?.name || 'Friend';

    setActiveCallInfo({
      isOpen: true,
      contactName: name,
      isVideo,
    });

    if (targetUser) {
      try {
        const callId = await webRTC.startCall(
          currentUser,
          targetUser,
          isVideo,
          () => {},
          (status) => {
            if (status === 'declined' || status === 'ended' || status === 'busy') {
              setActiveCallInfo(null);
            }
          }
        );
        setActiveCallInfo({
          isOpen: true,
          contactName: name,
          isVideo,
          callId,
        });
      } catch (e) {
        console.warn('Start WebRTC call note:', e);
      }
    }
  };

  // WebRTC Accept Incoming Call Handler
  const handleAcceptIncomingCall = async () => {
    if (!incomingCallData || !currentUser) return;
    const data = incomingCallData;
    setIncomingCallData(null);

    setActiveCallInfo({
      isOpen: true,
      contactName: data.callerName,
      isVideo: data.isVideo,
      callId: data.callId,
    });

    try {
      await webRTC.acceptCall(
        data,
        () => {},
        (status) => {
          if (status === 'ended' || status === 'declined') {
            setActiveCallInfo(null);
          }
        }
      );
    } catch (e) {
      console.warn('Accept call note:', e);
    }
  };

  // WebRTC Decline Incoming Call Handler
  const handleDeclineIncomingCall = async () => {
    if (!incomingCallData) return;
    const callId = incomingCallData.callId;
    setIncomingCallData(null);
    await webRTC.declineCall(callId);
  };

  // Total Unread Count
  const totalUnreadCount = chatsList.reduce((acc, c) => acc + (c.unreadCount || 0), 0);
  const missedCallsCount = callsList.filter((c) => c.type === 'missed').length;

  // Render Splash Screen on initial boot
  if (isInitializing) {
    return <SplashScreen />;
  }

  // Render Login Screen if not authenticated
  if (!currentUser) {
    return <LoginScreen onLoginSuccess={(u) => setCurrentUser(u)} />;
  }

  // Render Admin Dashboard Screen if open
  if (isAdminDashboardOpen && currentUser.role === 'admin') {
    return (
      <AdminDashboard
        adminUser={currentUser}
        allUsers={usersList}
        onBackToApp={() => setIsAdminDashboardOpen(false)}
      />
    );
  }

  const selectedChat = chatsList.find((c) => c.id === activeChatId) || chatsList[0];

  // Core Messenger App Screen Layout
  const AppContent = (
    <div className="flex flex-col h-full w-full bg-slate-900 text-slate-100 overflow-hidden relative">
      
      {/* Top Header Bar */}
      <HeaderBar
        user={currentUser}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        isMobileFrameView={isMobileFrameView}
        onToggleFrameView={() => setIsMobileFrameView(!isMobileFrameView)}
        onLogout={handleLogout}
        onOpenNewChat={() => setIsNewChatOpen(true)}
        onSearchClick={() => {
          if (currentUser.role === 'admin') {
            setIsAdminDashboardOpen(true);
          } else {
            setActiveTab('chats');
          }
        }}
        unreadTotal={totalUnreadCount}
      />

      {/* Main Content Body */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* TAB 1: CHATS */}
        {activeTab === 'chats' && (
          <div className="flex-1 flex w-full h-full overflow-hidden">
            {/* Left Chat List Column */}
            <div className={`w-full md:w-80 lg:w-96 shrink-0 h-full ${activeChatId ? 'hidden md:block' : 'block'}`}>
              <ChatList
                chats={chatsList}
                activeChatId={activeChatId}
                onSelectChat={(id) => setActiveChatId(id)}
                currentUser={currentUser}
                contacts={usersList}
                onOpenNewChat={() => setIsNewChatOpen(true)}
              />
            </div>

            {/* Right Chat Conversation Column */}
            <div className={`flex-1 h-full min-w-0 ${!activeChatId ? 'hidden md:block' : 'block'}`}>
              {selectedChat ? (
                <ChatConversation
                  chat={selectedChat}
                  messages={activeMessages}
                  currentUser={currentUser}
                  onSendMessage={handleSendMessage}
                  onBack={() => setActiveChatId(null)}
                  onStartCall={(isVideo) => handleStartCall(isVideo)}
                  onAddReaction={handleAddReaction}
                  onAiTranslate={translateTextWithGemini}
                />
              ) : (
                <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-500 bg-slate-950">
                  <p className="text-sm font-semibold text-slate-400">Select or start a private conversation</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: CALLS */}
        {activeTab === 'calls' && (
          <div className="w-full h-full">
            <CallsList
              calls={callsList}
              onStartCall={(isVideo, contactName) => handleStartCall(isVideo, contactName)}
            />
          </div>
        )}

        {/* TAB 3: CONTACTS */}
        {activeTab === 'contacts' && (
          <div className="w-full h-full">
            <ContactsList
              contacts={usersList}
              onStartChatWithUser={handleStartDirectChat}
              onStartCallWithUser={(user) => handleStartCall(false, user.name)}
            />
          </div>
        )}

        {/* TAB 4: SETTINGS */}
        {activeTab === 'settings' && (
          <div className="w-full h-full">
            <SettingsView
              user={currentUser}
              onUpdateUserStatus={(newStatus) => {
                setCurrentUser((prev) => (prev ? { ...prev, status: newStatus } : null));
              }}
              isDarkMode={isDarkMode}
              onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
              onLogout={handleLogout}
            />
          </div>
        )}

      </div>

      {/* Bottom Thumb Navigation Bar */}
      <TabBar
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          if (tab === 'chats' && !activeChatId && chatsList.length > 0) {
            setActiveChatId(chatsList[0].id);
          }
        }}
        unreadChatsCount={totalUnreadCount}
        missedCallsCount={missedCallsCount}
      />

      {/* MODALS */}
      {isNewChatOpen && (
        <NewChatModal
          contacts={usersList}
          currentUser={currentUser}
          onClose={() => setIsNewChatOpen(false)}
          onCreateDirectChat={handleStartDirectChat}
          onCreateGroupChat={handleCreateGroupChat}
        />
      )}

      {incomingCallData && (
        <IncomingCallModal
          callData={incomingCallData}
          onAccept={handleAcceptIncomingCall}
          onDecline={handleDeclineIncomingCall}
        />
      )}

      {activeCallInfo?.isOpen && (
        <CallActiveModal
          callId={activeCallInfo.callId}
          contactName={activeCallInfo.contactName}
          isVideo={activeCallInfo.isVideo}
          onEndCall={() => setActiveCallInfo(null)}
        />
      )}

    </div>
  );

  // If Mobile Frame Container mode is toggled, render inside device frame
  if (isMobileFrameView) {
    return (
      <div className="min-h-screen w-full bg-slate-950 flex flex-col items-center justify-center p-2 sm:p-6 overflow-hidden">
        <div className="relative w-full max-w-[390px] h-[812px] bg-slate-900 border-[8px] border-slate-800 rounded-[48px] shadow-2xl overflow-hidden flex flex-col ring-1 ring-slate-700/50">
          <div className="h-6 bg-slate-900 flex items-center justify-between px-6 pt-1 text-[10px] font-semibold text-slate-400 z-50 shrink-0">
            <span>9:41</span>
            <div className="w-16 h-3 bg-slate-950 rounded-full mx-auto" />
            <div className="flex items-center gap-1">
              <span>5G</span>
              <div className="w-4 h-2 border border-slate-400 rounded-sm flex p-[0.5px]">
                <div className="w-full h-full bg-emerald-400 rounded-[0.5px]" />
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-hidden relative">{AppContent}</div>
          <div className="h-4 bg-slate-900 flex items-center justify-center shrink-0 pb-1">
            <div className="w-28 h-1 bg-slate-700 rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  // Full Screen Responsive Layout
  return (
    <div className="h-screen w-screen bg-slate-900 overflow-hidden">
      {AppContent}
    </div>
  );
}
