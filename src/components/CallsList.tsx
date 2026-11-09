import React, { useState } from 'react';
import { 
  Phone, 
  Video, 
  PhoneIncoming, 
  PhoneOutgoing, 
  PhoneMissed, 
  Plus, 
  Search, 
  X,
  Clock
} from 'lucide-react';
import { CallLog } from '../types/chat';

interface CallsListProps {
  calls: CallLog[];
  onStartCall: (isVideo: boolean, contactName?: string) => void;
}

export const CallsList: React.FC<CallsListProps> = ({ calls, onStartCall }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showDialer, setShowDialer] = useState(false);
  const [dialPadNumber, setDialPadNumber] = useState('');

  const filteredCalls = calls.filter((c) =>
    c.contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.contact.phone.includes(searchQuery)
  );

  const handleDialerPress = (digit: string) => {
    if (dialPadNumber.length < 15) {
      setDialPadNumber((prev) => prev + digit);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 overflow-hidden select-none">
      
      {/* Search & Header Section */}
      <div className="p-3.5 space-y-3 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white">Call Logs</h2>
          <button
            type="button"
            onClick={() => setShowDialer(true)}
            className="h-8 px-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg text-xs font-bold flex items-center gap-1 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Call</span>
          </button>
        </div>

        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search call logs..."
            className="w-full h-10 pl-9 pr-8 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          />
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
        </div>
      </div>

      {/* Call History List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-800/40">
        {filteredCalls.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <Clock className="w-8 h-8 mx-auto mb-2 text-slate-600" />
            <p className="text-xs font-medium">No recent calls recorded</p>
          </div>
        ) : (
          filteredCalls.map((call) => (
            <div
              key={call.id}
              className="p-3.5 flex items-center justify-between hover:bg-slate-800/40 transition-colors"
            >
              <div className="flex items-center gap-3">
                <img
                  src={call.contact.avatar}
                  alt={call.contact.name}
                  className="w-11 h-11 rounded-full object-cover border border-slate-700"
                />

                <div>
                  <h4 className="text-xs sm:text-sm font-semibold text-slate-100 flex items-center gap-1.5">
                    <span>{call.contact.name}</span>
                  </h4>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                    {call.type === 'incoming' && <PhoneIncoming className="w-3.5 h-3.5 text-emerald-400" />}
                    {call.type === 'outgoing' && <PhoneOutgoing className="w-3.5 h-3.5 text-cyan-400" />}
                    {call.type === 'missed' && <PhoneMissed className="w-3.5 h-3.5 text-rose-400" />}
                    <span>{call.timestamp}</span>
                    {call.duration && (
                      <>
                        <span className="text-slate-600">·</span>
                        <span className="font-mono">{call.duration}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onStartCall(false, call.contact.name)}
                  className="w-9 h-9 rounded-full bg-slate-950 border border-slate-800 text-emerald-400 hover:bg-emerald-500/20 flex items-center justify-center transition-colors"
                  title="Voice Call"
                >
                  <Phone className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onStartCall(true, call.contact.name)}
                  className="w-9 h-9 rounded-full bg-slate-950 border border-slate-800 text-cyan-400 hover:bg-cyan-500/20 flex items-center justify-center transition-colors"
                  title="Video Call"
                >
                  <Video className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Interactive Dialer Modal */}
      {showDialer && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-xs shadow-2xl text-center">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                TOMAN Dialer
              </span>
              <button
                type="button"
                onClick={() => {
                  setShowDialer(false);
                  setDialPadNumber('');
                }}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Number Display */}
            <div className="h-12 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-center px-3 mb-5">
              <span className="text-lg font-bold font-mono text-emerald-400 tracking-wider">
                {dialPadNumber || 'Enter Number'}
              </span>
            </div>

            {/* Keypad */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => handleDialerPress(digit)}
                  className="h-12 bg-slate-950 border border-slate-800 hover:border-emerald-500/40 hover:bg-slate-800 rounded-2xl text-base font-bold font-mono text-white active:scale-95 transition-all"
                >
                  {digit}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDialPadNumber((prev) => prev.slice(0, -1))}
                className="flex-1 h-11 bg-slate-800 text-slate-300 font-semibold text-xs rounded-xl"
              >
                Delete
              </button>
              <button
                type="button"
                onClick={() => {
                  if (dialPadNumber) {
                    onStartCall(false, dialPadNumber);
                    setShowDialer(false);
                    setDialPadNumber('');
                  }
                }}
                className="flex-1 h-11 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md"
              >
                <Phone className="w-4 h-4" />
                <span>Call</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
