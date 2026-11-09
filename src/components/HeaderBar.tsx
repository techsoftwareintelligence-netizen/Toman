import React from 'react';
import { 
  Smartphone, 
  Monitor, 
  Moon, 
  Sun, 
  Search, 
  Plus, 
  LogOut, 
  ShieldCheck, 
  Bell 
} from 'lucide-react';
import { UserProfile } from '../types/chat';
import { LOGO_URL } from '../data/mockData';

interface HeaderBarProps {
  user: UserProfile;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  isMobileFrameView: boolean;
  onToggleFrameView: () => void;
  onLogout: () => void;
  onOpenNewChat: () => void;
  onSearchClick: () => void;
  unreadTotal: number;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  user,
  isDarkMode,
  onToggleDarkMode,
  isMobileFrameView,
  onToggleFrameView,
  onLogout,
  onOpenNewChat,
  onSearchClick,
  unreadTotal,
}) => {
  return (
    <header className="h-14 px-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between gap-4 sticky top-0 z-30 backdrop-blur-md shrink-0">
      {/* Zone 1: Brand Wordmark */}
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="relative">
          <img
            src={LOGO_URL}
            alt="TOMAN Logo"
            className="w-8 h-8 rounded-lg object-cover border border-slate-700/60 shadow-sm"
          />
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-slate-900" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-sm tracking-tight text-white whitespace-nowrap">
              TOMAN
            </span>
            {unreadTotal > 0 && (
              <span className="bg-emerald-500 text-slate-950 font-bold text-[10px] px-1.5 py-0.2 rounded-full min-w-[18px] text-center">
                {unreadTotal}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 text-[10px] text-slate-400">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            <span className="whitespace-nowrap">Encrypted</span>
          </div>
        </div>
      </div>

      {/* Zone 2: Action Shortcuts & Desktop/Mobile Frame Toggle */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Admin Console Shortcut */}
        {(user.role === 'admin' || (user as any).role === 'admin') && (
          <button
            type="button"
            onClick={() => onSearchClick()}
            className="h-9 px-2.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
            title="Open Admin Console"
          >
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">Admin Console</span>
          </button>
        )}

        {/* Frame Toggle */}
        <button
          type="button"
          onClick={onToggleFrameView}
          title={isMobileFrameView ? 'Switch to Full Width Responsive Mode' : 'Switch to Mobile Frame Mode'}
          className={`h-9 px-2.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border ${
            isMobileFrameView 
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
              : 'bg-slate-800/80 text-slate-300 border-slate-700/60 hover:text-white'
          }`}
        >
          {isMobileFrameView ? (
            <>
              <Smartphone className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Mobile Frame</span>
            </>
          ) : (
            <>
              <Monitor className="w-4 h-4" />
              <span className="hidden sm:inline">Responsive</span>
            </>
          )}
        </button>

        {/* New Chat Button */}
        <button
          type="button"
          onClick={onOpenNewChat}
          className="h-9 px-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg text-xs font-bold flex items-center gap-1 transition-all shadow-sm active:scale-95"
          title="New Direct Message or Group"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">New Chat</span>
        </button>

        {/* Theme Toggle */}
        <button
          type="button"
          onClick={onToggleDarkMode}
          className="w-9 h-9 flex items-center justify-center rounded-lg bg-slate-800/80 border border-slate-700/60 text-slate-300 hover:text-white transition-colors"
          title={isDarkMode ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
        >
          {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
        </button>

        {/* User Avatar & Logout */}
        <div className="flex items-center gap-2 pl-1 border-l border-slate-800">
          <img
            src={user.avatar}
            alt={user.name}
            className="w-8 h-8 rounded-full object-cover border border-slate-700"
            title={`${user.name} (${user.phone})`}
          />
          <button
            type="button"
            onClick={onLogout}
            className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
