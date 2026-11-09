import React, { useEffect } from 'react';
import { Phone, PhoneOff, Video, ShieldCheck } from 'lucide-react';
import { ActiveCallData } from '../services/webrtcService';
import { sounds } from '../utils/sound';

interface IncomingCallModalProps {
  callData: ActiveCallData;
  onAccept: () => void;
  onDecline: () => void;
}

export const IncomingCallModal: React.FC<IncomingCallModalProps> = ({
  callData,
  onAccept,
  onDecline,
}) => {
  // Play continuous ringing chime sound
  useEffect(() => {
    sounds.playReceiveSound();
    const interval = setInterval(() => {
      sounds.playReceiveSound();
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-2xl z-50 flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-center relative overflow-hidden flex flex-col items-center justify-between min-h-[440px]">
        
        {/* Top Security Banner */}
        <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-3.5 py-1 rounded-full border border-emerald-500/30">
          <ShieldCheck className="w-4 h-4" />
          <span>ইনকামিং প্রাইভেট কল (Incoming E2EE Call)</span>
        </div>

        {/* Caller Avatar & Info */}
        <div className="my-auto space-y-4 w-full">
          <div className="relative w-28 h-28 mx-auto">
            <span className="absolute inset-0 bg-emerald-500/30 rounded-full animate-ping" />
            <div className="relative w-28 h-28 rounded-full bg-slate-800 border-2 border-emerald-400 p-1 shadow-2xl">
              <img
                src={callData.callerAvatar || '/src/assets/images/avatar_alex_1794242931602.jpg'}
                alt={callData.callerName}
                className="w-full h-full rounded-full object-cover"
              />
            </div>
          </div>

          <div>
            <h3 className="text-xl font-extrabold text-white">{callData.callerName}</h3>
            <p className="text-xs text-emerald-400 font-semibold mt-1 flex items-center justify-center gap-1">
              {callData.isVideo ? (
                <>
                  <Video className="w-4 h-4" />
                  <span>Incoming HD Video Call...</span>
                </>
              ) : (
                <>
                  <Phone className="w-4 h-4" />
                  <span>Incoming Voice Call...</span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Action Buttons: Decline & Accept */}
        <div className="flex items-center justify-center gap-6 w-full pt-4 border-t border-slate-800/80">
          {/* Decline Button */}
          <button
            type="button"
            onClick={onDecline}
            className="w-16 h-16 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex flex-col items-center justify-center shadow-lg shadow-rose-600/30 active:scale-95 transition-all"
            title="Decline Call"
          >
            <PhoneOff className="w-6 h-6" />
            <span className="text-[9px] font-bold mt-0.5">Decline</span>
          </button>

          {/* Accept Button */}
          <button
            type="button"
            onClick={onAccept}
            className="w-16 h-16 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex flex-col items-center justify-center shadow-lg shadow-emerald-500/30 active:scale-95 transition-all animate-bounce"
            title="Accept Call"
          >
            <Phone className="w-6 h-6 fill-current" />
            <span className="text-[9px] font-extrabold mt-0.5">Accept</span>
          </button>
        </div>

      </div>
    </div>
  );
};
