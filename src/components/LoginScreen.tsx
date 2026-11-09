import React, { useState } from 'react';
import { 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  ArrowRight, 
  Key, 
  Sparkles 
} from 'lucide-react';
import { LOGO_URL } from '../data/mockData';
import { loginWithUsername, TomanUser } from '../services/userService';
import { sounds } from '../utils/sound';

interface LoginScreenProps {
  onLoginSuccess: (user: TomanUser) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('tomanadmin');
  const [password, setPassword] = useState('887767');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    sounds.playClickSound();
    setErrorMsg('');

    const cleanUser = username.trim().toLowerCase();
    if (!cleanUser) {
      setErrorMsg('ইউজারনেম লিখুন (Please enter your username)');
      return;
    }
    if (!password) {
      setErrorMsg('পাসওয়ার্ড লিখুন (Please enter your password)');
      return;
    }

    setIsLoading(true);
    try {
      const loggedUser = await loginWithUsername(cleanUser, password);
      sounds.playReceiveSound();
      onLoginSuccess(loggedUser);
    } catch (err: any) {
      setErrorMsg(err.message || 'ইউজারনেম অথবা পাসওয়ার্ড সঠিক নয়। (Invalid credentials)');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 bg-slate-950 text-slate-100 relative overflow-hidden select-none">
      
      {/* Background Gradients */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative z-10 my-auto">
        
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center mb-3">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-2xl blur opacity-30 group-hover:opacity-70 transition duration-500" />
              <img 
                src={LOGO_URL} 
                alt="TOMAN Logo" 
                className="w-16 h-16 rounded-2xl object-cover relative shadow-lg border border-slate-700/50"
              />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            TOMAN
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Private Friends Messenger & Secure Network
          </p>

          <div className="flex items-center justify-center gap-1.5 mt-3 text-xs text-emerald-400 font-medium bg-emerald-500/10 py-1 px-3 rounded-full border border-emerald-500/20 max-w-xs mx-auto">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>সিকিউর প্রাইভেট মেসেঞ্জার • End-to-End Encrypted</span>
          </div>
        </div>

        {/* Clear Error Message Alert */}
        {errorMsg && (
          <div className="mb-4 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs text-center font-semibold animate-shake">
            ⚠️ {errorMsg}
          </div>
        )}

        {/* LOGIN FORM (Username & Password ONLY) */}
        <form onSubmit={handleLoginSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              ইউজারনেম (Username)
            </label>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                placeholder="ইউজারনেম লিখুন (e.g. tomanadmin)"
                className="w-full h-11 pl-10 pr-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                required
              />
              <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              পাসওয়ার্ড (Password)
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="পাসওয়ার্ড লিখুন"
                className="w-full h-11 pl-10 pr-10 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                required
              />
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-200"
                title={showPassword ? 'Hide Password' : 'Show Password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-11 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-[0.99] transition-all disabled:opacity-50 mt-2"
          >
            {isLoading ? (
              <span className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>লগইন করুন (Sign In)</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-5 text-center text-[11px] text-slate-500">
          <span>প্রাইভেট ফ্রেন্ডস নেটওয়ার্ক • এডমিন দ্বারা অ্যাকাউন্ট তৈরি করা হয়</span>
        </div>

      </div>
    </div>
  );
};
