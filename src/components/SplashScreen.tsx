import React from 'react';
import { LOGO_URL } from '../data/mockData';
import { ShieldCheck } from 'lucide-react';

export const SplashScreen: React.FC = () => {
  return (
    <div className="min-h-screen w-full bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-100 select-none relative overflow-hidden">
      <div className="absolute top-1/3 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      
      <div className="text-center relative z-10 flex flex-col items-center">
        <div className="relative mb-4">
          <div className="absolute -inset-2 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-3xl blur opacity-40 animate-pulse" />
          <img 
            src={LOGO_URL} 
            alt="TOMAN Logo" 
            className="w-20 h-20 rounded-2xl object-cover relative shadow-2xl border border-slate-700/60"
          />
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight text-white mb-1">
          TOMAN
        </h1>
        <p className="text-xs text-slate-400 font-medium mb-6">
          Verifying Private Encryption Handshake...
        </p>

        <div className="flex items-center gap-2 px-4 py-2 bg-slate-900/90 border border-slate-800 rounded-full shadow-lg">
          <span className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-emerald-400 font-mono font-semibold">
            Connecting Firebase Auth
          </span>
        </div>
      </div>
    </div>
  );
};
