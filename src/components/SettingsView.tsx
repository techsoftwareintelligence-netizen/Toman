import React, { useState } from 'react';
import { 
  User, 
  ShieldCheck, 
  Lock, 
  Moon, 
  Sun, 
  Bell, 
  Palette, 
  Smartphone, 
  LogOut, 
  Key, 
  ChevronRight, 
  Check, 
  Sparkles 
} from 'lucide-react';
import { UserProfile } from '../types/chat';

interface SettingsViewProps {
  user: UserProfile;
  onUpdateUserStatus: (newStatus: string) => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onLogout: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  user,
  onUpdateUserStatus,
  isDarkMode,
  onToggleDarkMode,
  onLogout,
}) => {
  const [statusInput, setStatusInput] = useState(user.status);
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [passcodeEnabled, setPasscodeEnabled] = useState(true);
  const [biometricsEnabled, setBiometricsEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [readReceiptsEnabled, setReadReceiptsEnabled] = useState(true);
  const [selectedWallpaper, setSelectedWallpaper] = useState('Midnight Emerald');

  const handleSaveStatus = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateUserStatus(statusInput);
    setIsEditingStatus(false);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 overflow-y-auto select-none p-4 space-y-5">
      
      {/* Profile Card Header */}
      <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex items-center gap-4">
          <img
            src={user.avatar}
            alt={user.name}
            className="w-16 h-16 rounded-full object-cover border-2 border-emerald-400 shadow-md"
          />

          <div className="flex-1 min-w-0">
            <h3 className="text-base font-extrabold text-white truncate flex items-center gap-1.5">
              <span>{user.name}</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            </h3>
            <p className="text-xs text-slate-400 font-mono mt-0.5">{user.phone}</p>
            <p className="text-xs text-slate-500 truncate">{user.email}</p>
          </div>
        </div>

        {/* Bio Status Bar */}
        <div className="mt-4 pt-3 border-t border-slate-800/80">
          {isEditingStatus ? (
            <form onSubmit={handleSaveStatus} className="flex gap-2">
              <input
                type="text"
                value={statusInput}
                onChange={(e) => setStatusInput(e.target.value)}
                className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-emerald-500 text-slate-950 font-bold text-xs rounded-xl"
              >
                Save
              </button>
            </form>
          ) : (
            <div className="flex items-center justify-between text-xs text-slate-300">
              <p className="italic truncate pr-2">"{user.status}"</p>
              <button
                type="button"
                onClick={() => setIsEditingStatus(true)}
                className="text-emerald-400 hover:underline font-semibold text-[11px] shrink-0"
              >
                Edit Bio
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Admin Console Shortcut */}
      {((user as any).role === 'admin' || user.role === 'admin') && (
        <div className="bg-slate-950 border border-cyan-500/40 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>Admin Management Dashboard</span>
            </div>
            <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[10px] font-bold">
              ADMIN ROLE
            </span>
          </div>
          <p className="text-xs text-slate-300">
            Create friend accounts, manage access permissions, and reset user passwords.
          </p>
          <button
            type="button"
            onClick={() => {
              if ((window as any).openAdminDashboard) {
                (window as any).openAdminDashboard();
              }
            }}
            className="w-full py-2.5 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Open Admin Dashboard</span>
          </button>
        </div>
      )}

      {/* Security & Encryption Section */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
          <Lock className="w-4 h-4 text-emerald-400" />
          <span>Security & Encryption</span>
        </div>

        <div className="flex items-center justify-between py-2 border-b border-slate-800/60 text-xs">
          <div>
            <p className="font-semibold text-slate-200">End-to-End Security</p>
            <p className="text-[11px] text-slate-500">Signal Protocol with Double Ratchet</p>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold text-[10px]">
            ACTIVE
          </span>
        </div>

        <div className="flex items-center justify-between py-2 border-b border-slate-800/60 text-xs">
          <div>
            <p className="font-semibold text-slate-200">Passcode Lock</p>
            <p className="text-[11px] text-slate-500">Require PIN code on app startup</p>
          </div>
          <input
            type="checkbox"
            checked={passcodeEnabled}
            onChange={(e) => setPasscodeEnabled(e.target.checked)}
            className="w-4 h-4 rounded border-slate-800 bg-slate-900 text-emerald-500 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center justify-between py-2 text-xs">
          <div>
            <p className="font-semibold text-slate-200">Biometrics / Face ID</p>
            <p className="text-[11px] text-slate-500">Instant unlock with biometric sensor</p>
          </div>
          <input
            type="checkbox"
            checked={biometricsEnabled}
            onChange={(e) => setBiometricsEnabled(e.target.checked)}
            className="w-4 h-4 rounded border-slate-800 bg-slate-900 text-emerald-500 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Preferences & Appearance */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
          <Palette className="w-4 h-4 text-cyan-400" />
          <span>Appearance & Chat Wallpaper</span>
        </div>

        <div className="flex items-center justify-between py-2 border-b border-slate-800/60 text-xs">
          <div className="flex items-center gap-2">
            {isDarkMode ? <Moon className="w-4 h-4 text-indigo-400" /> : <Sun className="w-4 h-4 text-amber-400" />}
            <div>
              <p className="font-semibold text-slate-200">Theme Mode</p>
              <p className="text-[11px] text-slate-500">{isDarkMode ? 'Dark Midnight' : 'Clean Light'}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onToggleDarkMode}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl"
          >
            Toggle Theme
          </button>
        </div>

        <div className="py-2 text-xs">
          <p className="font-semibold text-slate-200 mb-2">Chat Wallpaper Theme</p>
          <div className="grid grid-cols-2 gap-2">
            {['Midnight Emerald', 'Deep Slate', 'Cyber Pulse', 'Warm Paper'].map((wp) => (
              <button
                key={wp}
                type="button"
                onClick={() => setSelectedWallpaper(wp)}
                className={`p-2 rounded-xl text-left border text-xs flex items-center justify-between ${
                  selectedWallpaper === wp
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 font-bold'
                    : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                <span>{wp}</span>
                {selectedWallpaper === wp && <Check className="w-3.5 h-3.5" />}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
          <Bell className="w-4 h-4 text-amber-400" />
          <span>Notifications & Sound</span>
        </div>

        <div className="flex items-center justify-between py-2 border-b border-slate-800/60 text-xs">
          <p className="font-semibold text-slate-200">Push Notifications</p>
          <input
            type="checkbox"
            checked={notificationsEnabled}
            onChange={(e) => setNotificationsEnabled(e.target.checked)}
            className="w-4 h-4 rounded border-slate-800 bg-slate-900 text-emerald-500"
          />
        </div>

        <div className="flex items-center justify-between py-2 text-xs">
          <p className="font-semibold text-slate-200">Read Receipts (Blue Checks)</p>
          <input
            type="checkbox"
            checked={readReceiptsEnabled}
            onChange={(e) => setReadReceiptsEnabled(e.target.checked)}
            className="w-4 h-4 rounded border-slate-800 bg-slate-900 text-emerald-500"
          />
        </div>
      </div>

      {/* Logout Action */}
      <div className="pt-2">
        <button
          type="button"
          onClick={onLogout}
          className="w-full py-3 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 font-bold text-xs rounded-2xl flex items-center justify-center gap-2 transition-all"
        >
          <LogOut className="w-4 h-4" />
          <span>Log Out of TOMAN</span>
        </button>
      </div>

    </div>
  );
};
