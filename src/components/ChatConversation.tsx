import React, { useState, useRef, useEffect } from 'react';
import { 
  ArrowLeft, 
  Phone, 
  Video, 
  MoreVertical, 
  Search, 
  Send, 
  Paperclip, 
  Smile, 
  Mic, 
  Check, 
  CheckCheck, 
  Play, 
  Pause, 
  Sparkles, 
  Image as ImageIcon, 
  FileText, 
  X, 
  Info,
  ShieldAlert,
  Reply,
  Square,
  Trash2
} from 'lucide-react';
import { ChatThread, ChatMessage, UserProfile } from '../types/chat';
import { sounds } from '../utils/sound';
import { VoiceRecorder } from '../utils/audioRecorder';
import { setTypingIndicator, deleteChatMessage } from '../services/chatService';

interface ChatConversationProps {
  chat: ChatThread;
  messages: ChatMessage[];
  currentUser: UserProfile;
  typingUsers?: string[];
  onSendMessage: (text: string, type?: 'text' | 'image' | 'video' | 'audio' | 'voice' | 'file', mediaUrl?: string) => void;
  onBack: () => void;
  onStartCall: (isVideo: boolean) => void;
  onAddReaction: (messageId: string, emoji: string) => void;
  onAiTranslate: (text: string) => Promise<string>;
}

export const ChatConversation: React.FC<ChatConversationProps> = ({
  chat,
  messages,
  currentUser,
  typingUsers = [],
  onSendMessage,
  onBack,
  onStartCall,
  onAddReaction,
  onAiTranslate,
}) => {
  const [inputText, setInputText] = useState('');
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  
  // Real Mic Voice Recorder State
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [voiceTimer, setVoiceTimer] = useState(0);
  const recorderRef = useRef<VoiceRecorder | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [showInfoDrawer, setShowInfoDrawer] = useState(false);
  const [aiLoadingMessageId, setAiLoadingMessageId] = useState<string | null>(null);
  const [translatedMap, setTranslatedMap] = useState<Record<string, string>>({});
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages update & play receive sound
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    if (messages.length > 0) {
      const last = messages[messages.length - 1];
      if (last.senderId !== currentUser.id) {
        sounds.playReceiveSound();
      }
    }
  }, [messages.length]);

  // Handle typing status signaling
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    setTypingIndicator(chat.id, currentUser.id, currentUser.username || currentUser.name, e.target.value.length > 0);
  };

  // Voice recording timer simulation
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecordingVoice) {
      interval = setInterval(() => {
        setVoiceTimer((prev) => prev + 1);
      }, 1000);
    } else {
      setVoiceTimer(0);
    }
    return () => clearInterval(interval);
  }, [isRecordingVoice]);

  // Start Real Microphone Recording
  const handleStartRealVoiceRecord = async () => {
    try {
      const recorder = new VoiceRecorder();
      await recorder.start();
      recorderRef.current = recorder;
      setIsRecordingVoice(true);
      sounds.playClickSound();
    } catch (err: any) {
      alert('মাইক্রোফোন পারমিশন প্রয়োজন (Microphone access required): ' + err.message);
    }
  };

  // Stop & Send Real Voice Clip
  const handleStopAndSendVoice = async () => {
    if (!recorderRef.current) return;
    try {
      const { audioUrl, duration } = await recorderRef.current.stop();
      setIsRecordingVoice(false);
      sounds.playSendSound();
      onSendMessage(`🎤 Voice Note (${duration})`, 'voice', audioUrl);
    } catch (err: any) {
      console.error('Voice recording error:', err);
      setIsRecordingVoice(false);
    }
  };

  // Cancel Voice Recording
  const handleCancelVoice = () => {
    if (recorderRef.current) {
      recorderRef.current.cancel();
    }
    setIsRecordingVoice(false);
  };

  // Real Image File Picker Handler
  const handleImageFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('ছবির সাইজ সর্ব্বোচ্চ 5MB হতে পারবে। (Image size limit is 5MB)');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64Url = reader.result as string;
      sounds.playSendSound();
      onSendMessage(file.name, 'image', base64Url);
      setShowAttachmentMenu(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;
    sounds.playSendSound();
    onSendMessage(inputText.trim(), 'text');
    setInputText('');
    setReplyingTo(null);
    setTypingIndicator(chat.id, currentUser.id, currentUser.username || currentUser.name, false);
  };

  const handleTranslateMsg = async (msg: ChatMessage) => {
    setAiLoadingMessageId(msg.id);
    try {
      const translation = await onAiTranslate(msg.text);
      setTranslatedMap((prev) => ({ ...prev, [msg.id]: translation }));
    } catch {
      setTranslatedMap((prev) => ({ ...prev, [msg.id]: 'অনুবাদ পাওয়া যায়নি।' }));
    } finally {
      setAiLoadingMessageId(null);
    }
  };

  const handleDeleteMsg = async (msgId: string) => {
    if (window.confirm('মেসেজটি মুছে ফেলতে চান? (Delete message?)')) {
      await deleteChatMessage(chat.id, msgId);
    }
  };

  const otherUser = !chat.isGroup ? chat.members.find((m) => m.id !== currentUser.id) : null;
  const title = chat.isGroup ? chat.name || 'Group Chat' : otherUser?.name || 'Contact';
  const avatar = chat.isGroup ? chat.avatar || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&auto=format&fit=crop&q=80' : otherUser?.avatar;
  const isOnline = chat.isGroup ? false : otherUser?.isOnline;

  const EMOJI_LIST = ['👍', '❤️', '🔥', '😂', '🚀', '🙌', '💯', '😍', '👏'];

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 relative overflow-hidden select-none">
      
      {/* Hidden File Input for Real Image Upload */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={handleImageFileSelect}
        className="hidden"
      />

      {/* Hidden Audio Player for Real Voice Notes */}
      <audio ref={audioPlayerRef} className="hidden" />

      {/* Top Header Bar */}
      <div className="h-14 px-3 sm:px-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between gap-2 shrink-0 z-20 backdrop-blur-md">
        
        {/* Left: Back Button & Contact Info */}
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            title="Back to Chats"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={() => setShowInfoDrawer(!showInfoDrawer)}
            className="flex items-center gap-2.5 text-left min-w-0 group"
          >
            <div className="relative shrink-0">
              <img
                src={avatar}
                alt={title}
                className="w-9 h-9 rounded-full object-cover border border-slate-700 shadow-sm"
              />
              {isOnline && (
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-slate-900" />
              )}
            </div>

            <div className="min-w-0">
              <h3 className="text-xs sm:text-sm font-bold text-slate-100 truncate group-hover:text-emerald-400 transition-colors">
                {title}
              </h3>
              <p className="text-[10px] text-slate-400 truncate flex items-center gap-1">
                {typingUsers.length > 0 ? (
                  <span className="text-emerald-400 font-bold italic animate-pulse">
                    {typingUsers.join(', ')} typing...
                  </span>
                ) : chat.isGroup ? (
                  `${chat.members.length || 2} Members`
                ) : isOnline ? (
                  'Online'
                ) : (
                  otherUser?.lastSeen || 'Offline'
                )}
              </p>
            </div>
          </button>
        </div>

        {/* Right: Audio/Video Call & Options */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => onStartCall(false)}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-300 hover:text-emerald-400 hover:bg-slate-800 transition-colors"
            title="Voice Call"
          >
            <Phone className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => onStartCall(true)}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-300 hover:text-emerald-400 hover:bg-slate-800 transition-colors"
            title="Video Call"
          >
            <Video className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setShowInfoDrawer(!showInfoDrawer)}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            title="Chat Settings & Details"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Conversation Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900/60">
        
        {/* Security Encryption Notice Banner */}
        <div className="flex items-center justify-center my-1">
          <div className="px-3.5 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400 flex items-center gap-1.5 shadow-sm">
            <ShieldAlert className="w-3.5 h-3.5 text-emerald-400" />
            <span>প্রাইভেট এন্ড-টু-এন্ড এনক্রিপ্টেড মেসেঞ্জার network</span>
          </div>
        </div>

        {/* Message Cards */}
        {messages.map((msg) => {
          const isMine = msg.senderId === currentUser.id;
          const senderUser = chat.members.find((m) => m.id === msg.senderId);
          const isPlaying = playingVoiceId === msg.id;

          return (
            <div
              key={msg.id}
              className={`flex items-end gap-2 ${isMine ? 'justify-end' : 'justify-start'} group`}
            >
              {/* Other User Avatar in Group */}
              {!isMine && chat.isGroup && (
                <img
                  src={senderUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'}
                  alt={senderUser?.name || 'Member'}
                  className="w-7 h-7 rounded-full object-cover border border-slate-800 self-end mb-1 shrink-0"
                />
              )}

              {/* Message Content Container */}
              <div className={`max-w-[82%] sm:max-w-[70%] relative ${isMine ? 'items-end' : 'items-start'}`}>
                
                {/* Sender Name in Group */}
                {!isMine && chat.isGroup && (
                  <p className="text-[10px] font-semibold text-emerald-400 mb-1 ml-1">
                    {senderUser?.name}
                  </p>
                )}

                {/* Reply Indicator */}
                {msg.replyToId && (
                  <div className="mb-1 p-2 rounded-lg bg-slate-800/80 border-l-2 border-emerald-400 text-xs text-slate-300">
                    <p className="text-[10px] text-emerald-400 font-bold">Replying to message</p>
                  </div>
                )}

                {/* Main Bubble */}
                <div
                  className={`p-3 rounded-2xl relative shadow-md transition-all ${
                    isMine
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-br-none'
                      : 'bg-slate-800/90 border border-slate-700/60 text-slate-100 rounded-bl-none'
                  }`}
                >
                  {/* Text Message */}
                  {msg.type === 'text' && (
                    <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words">
                      {msg.text}
                    </p>
                  )}

                  {/* Voice Note Player */}
                  {msg.type === 'voice' && (
                    <div className="flex items-center gap-3 py-1">
                      <button
                        type="button"
                        onClick={() => {
                          if (isPlaying) {
                            if (audioPlayerRef.current) audioPlayerRef.current.pause();
                            setPlayingVoiceId(null);
                          } else {
                            setPlayingVoiceId(msg.id);
                            if (audioPlayerRef.current && msg.mediaUrl) {
                              audioPlayerRef.current.src = msg.mediaUrl;
                              audioPlayerRef.current.play();
                              audioPlayerRef.current.onended = () => setPlayingVoiceId(null);
                            }
                          }
                        }}
                        className={`w-9 h-9 rounded-full flex items-center justify-center transition-transform active:scale-95 ${
                          isMine ? 'bg-white text-emerald-800' : 'bg-emerald-500 text-slate-950 font-bold'
                        }`}
                      >
                        {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                      </button>

                      <div className="flex-1 min-w-[120px]">
                        <div className="flex items-center gap-1 h-5">
                          {[40, 75, 30, 90, 50, 80, 45, 60, 30, 85, 40].map((height, i) => (
                            <span
                              key={i}
                              style={{ height: `${height}%` }}
                              className={`w-1 rounded-full transition-all ${
                                isPlaying ? 'bg-emerald-300 animate-pulse' : isMine ? 'bg-white/60' : 'bg-slate-400'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-[10px] font-mono opacity-80 mt-0.5 block">
                          {msg.voiceDuration || '0:15'}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Image Message */}
                  {msg.type === 'image' && msg.mediaUrl && (
                    <div className="space-y-1">
                      <img
                        src={msg.mediaUrl}
                        alt="Shared Photo"
                        className="rounded-xl max-h-64 object-cover border border-slate-700/50"
                      />
                      {msg.text && msg.text !== msg.mediaUrl && (
                        <p className="text-xs pt-1">{msg.text}</p>
                      )}
                    </div>
                  )}

                  {/* AI Translated Result */}
                  {translatedMap[msg.id] && (
                    <div className="mt-2 pt-2 border-t border-white/20 text-xs italic bg-black/20 p-2 rounded-lg">
                      <span className="text-[10px] font-bold text-emerald-300 block mb-0.5">
                        ✨ TOMAN AI Translation:
                      </span>
                      {translatedMap[msg.id]}
                    </div>
                  )}

                  {/* Footer Meta: Timestamp & Read Status */}
                  <div className="flex items-center justify-end gap-1 mt-1 text-[10px] opacity-75">
                    <span className="font-mono">{msg.timestamp}</span>
                    {isMine && (
                      <span>
                        {msg.status === 'read' || msg.status === 'seen' ? (
                          <CheckCheck className="w-3.5 h-3.5 text-emerald-200" />
                        ) : (
                          <Check className="w-3.5 h-3.5 text-slate-300" />
                        )}
                      </span>
                    )}
                  </div>
                </div>

                {/* Reactions Badge */}
                {msg.reactions && msg.reactions.length > 0 && (
                  <div className="flex items-center gap-1 mt-0.5 ml-1">
                    {msg.reactions.map((r, i) => (
                      <span
                        key={i}
                        className="bg-slate-900 border border-slate-700 text-[11px] px-1.5 py-0.5 rounded-full shadow-sm"
                      >
                        {r.emoji} {r.count > 1 && r.count}
                      </span>
                    ))}
                  </div>
                )}

                {/* Hover Quick Action Bar */}
                <div className={`absolute top-0 ${isMine ? '-left-20' : '-right-20'} hidden group-hover:flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg shadow-lg z-10`}>
                  <button
                    type="button"
                    onClick={() => setReplyingTo(msg)}
                    className="p-1 text-slate-400 hover:text-emerald-400"
                    title="Reply"
                  >
                    <Reply className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onAddReaction(msg.id, '❤️')}
                    className="p-1 text-slate-400 hover:text-rose-400"
                    title="Heart"
                  >
                    ❤️
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTranslateMsg(msg)}
                    disabled={aiLoadingMessageId === msg.id}
                    className="p-1 text-slate-400 hover:text-amber-400"
                    title="Translate"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                  </button>
                  {isMine && (
                    <button
                      type="button"
                      onClick={() => handleDeleteMsg(msg.id)}
                      className="p-1 text-slate-400 hover:text-rose-400"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

              </div>
            </div>
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      {/* Reply Bar indicator */}
      {replyingTo && (
        <div className="px-4 py-2 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-300 truncate">
            <Reply className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="truncate">Replying to: <em>{replyingTo.text}</em></span>
          </div>
          <button
            type="button"
            onClick={() => setReplyingTo(null)}
            className="text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Voice Recording Active Bar */}
      {isRecordingVoice ? (
        <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 bg-rose-500 rounded-full animate-ping" />
            <span className="text-xs font-semibold text-rose-400">ভয়েস মেসেজ রেকর্ড হচ্ছে (Recording)...</span>
            <span className="text-xs font-mono text-slate-300 font-bold">
              0:{voiceTimer < 10 ? '0' : ''}{voiceTimer}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCancelVoice}
              className="px-3 py-1.5 text-xs text-slate-400 hover:text-white bg-slate-800 rounded-lg"
            >
              বাতিল (Cancel)
            </button>
            <button
              type="button"
              onClick={handleStopAndSendVoice}
              className="px-4 py-1.5 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg flex items-center gap-1 shadow-md"
            >
              <Send className="w-3.5 h-3.5" />
              <span>পাঠান (Send Voice)</span>
            </button>
          </div>
        </div>
      ) : (
        /* Standard Message Input Toolbar */
        <div className="p-3 bg-slate-900 border-t border-slate-800 relative">
          
          {/* Emoji Drawer Popup */}
          {showEmojiPicker && (
            <div className="absolute bottom-16 left-3 bg-slate-900 border border-slate-800 rounded-xl p-2 shadow-2xl flex gap-2 z-30">
              {EMOJI_LIST.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    setInputText((prev) => prev + emoji);
                    setShowEmojiPicker(false);
                  }}
                  className="text-lg hover:scale-125 transition-transform p-1"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}

          {/* Attachment Drawer Popup */}
          {showAttachmentMenu && (
            <div className="absolute bottom-16 left-10 bg-slate-900 border border-slate-800 rounded-xl p-2 shadow-2xl space-y-1 z-30 min-w-[170px]">
              <button
                type="button"
                onClick={() => {
                  fileInputRef.current?.click();
                  setShowAttachmentMenu(false);
                }}
                className="w-full px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800 rounded-lg flex items-center gap-2"
              >
                <ImageIcon className="w-4 h-4 text-emerald-400" />
                <span>ছবি আপলোড (Send Photo)</span>
              </button>
            </div>
          )}

          <form onSubmit={handleSend} className="flex items-center gap-2">
            
            {/* Attachment Button */}
            <button
              type="button"
              onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors shrink-0"
              title="Attach photo"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            {/* Emoji Trigger */}
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-amber-400 transition-colors shrink-0"
              title="Add Emoji"
            >
              <Smile className="w-4 h-4" />
            </button>

            {/* Text Input */}
            <div className="flex-1 relative">
              <input
                type="text"
                value={inputText}
                onChange={handleInputChange}
                placeholder="মেসেজ লিখুন (Type a message)..."
                className="w-full h-10 pl-3.5 pr-10 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
              />
            </div>

            {/* Mic / Send Trigger */}
            {inputText.trim() ? (
              <button
                type="submit"
                className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold rounded-xl flex items-center justify-center shadow-md active:scale-95 transition-all shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleStartRealVoiceRecord}
                className="w-10 h-10 bg-slate-950 border border-slate-800 text-slate-300 hover:text-emerald-400 hover:border-emerald-500/50 rounded-xl flex items-center justify-center active:scale-95 transition-all shrink-0"
                title="মাইক্রোফোন চেপে ভয়েস মেসেজ পাঠাতে ক্লিক করুন"
              >
                <Mic className="w-4 h-4 text-emerald-400" />
              </button>
            )}

          </form>
        </div>
      )}

      {/* Info Side Drawer Modal */}
      {showInfoDrawer && (
        <div className="absolute inset-y-0 right-0 w-72 bg-slate-900 border-l border-slate-800 shadow-2xl z-30 p-4 overflow-y-auto flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Chat Details
              </h4>
              <button
                type="button"
                onClick={() => setShowInfoDrawer(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-center py-6">
              <img
                src={avatar}
                alt={title}
                className="w-20 h-20 rounded-full object-cover mx-auto mb-3 border-2 border-emerald-500 shadow-md"
              />
              <h3 className="text-base font-bold text-white">{title}</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {chat.isGroup ? `${chat.members.length || 2} Members` : otherUser?.phone || ''}
              </p>
              {otherUser?.status && (
                <p className="text-xs text-emerald-400 mt-2 italic px-4">
                  "{otherUser.status}"
                </p>
              )}
            </div>

            <div className="space-y-3 pt-4 border-t border-slate-800 text-xs">
              <div className="flex items-center justify-between py-1 text-slate-300">
                <span>এনক্রিপশন (Encryption)</span>
                <span className="text-emerald-400 font-medium">E2EE Protocol</span>
              </div>
              <div className="flex items-center justify-between py-1 text-slate-300">
                <span>অনলাইন স্ট্যাটাস</span>
                <span className="text-emerald-400">{isOnline ? 'Active Now' : 'Offline'}</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => onStartCall(false)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 rounded-xl flex items-center justify-center gap-2 mb-2"
            >
              <Phone className="w-3.5 h-3.5 text-emerald-400" />
              <span>কল করুন (Voice Call)</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
