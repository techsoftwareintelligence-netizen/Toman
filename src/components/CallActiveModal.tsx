import React, { useState, useEffect, useRef } from 'react';
import { 
  PhoneOff, 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Volume2, 
  ShieldCheck, 
  RefreshCw 
} from 'lucide-react';
import { webRTC, ActiveCallData } from '../services/webrtcService';
import { sounds } from '../utils/sound';

interface CallActiveModalProps {
  callId?: string;
  contactName: string;
  isVideo: boolean;
  onEndCall: () => void;
}

export const CallActiveModal: React.FC<CallActiveModalProps> = ({
  callId,
  contactName,
  isVideo: initialIsVideo,
  onEndCall,
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideo, setIsVideo] = useState(initialIsVideo);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [seconds, setSeconds] = useState(0);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

  // Bind WebRTC Local and Remote Media Streams to Video/Audio elements
  useEffect(() => {
    const bindStreams = () => {
      const local = (webRTC as any).localStream;
      const remote = (webRTC as any).remoteStream;

      if (local && localVideoRef.current && localVideoRef.current.srcObject !== local) {
        localVideoRef.current.srcObject = local;
      }
      if (remote && remoteVideoRef.current && remoteVideoRef.current.srcObject !== remote) {
        remoteVideoRef.current.srcObject = remote;
      }
      if (remote && remoteAudioRef.current && remoteAudioRef.current.srcObject !== remote) {
        remoteAudioRef.current.srcObject = remote;
      }
    };

    bindStreams();
    const interval = setInterval(bindStreams, 500);
    return () => clearInterval(interval);
  }, [isVideo]);

  // Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Handle Mute
  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    webRTC.toggleMute(nextMuted);
    sounds.playClickSound();
  };

  // Handle Video Toggle
  const handleToggleVideo = () => {
    const nextVideoOff = isVideo;
    setIsVideo(!nextVideoOff);
    webRTC.toggleVideo(nextVideoOff);
    sounds.playClickSound();
  };

  // Handle Camera Flip
  const handleSwitchCamera = async () => {
    const nextFacing = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextFacing);
    const newStream = await webRTC.switchCamera(nextFacing);
    if (newStream && localVideoRef.current) {
      localVideoRef.current.srcObject = newStream;
    }
  };

  // End Call
  const handleEndCall = () => {
    sounds.playClickSound();
    if (callId) {
      webRTC.endCall(callId);
    }
    onEndCall();
  };

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-2xl z-50 flex items-center justify-center p-4 select-none">
      <audio ref={remoteAudioRef} autoPlay />

      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-center relative overflow-hidden flex flex-col items-center justify-between min-h-[460px]">
        
        {/* Top Security Header */}
        <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-3.5 py-1 rounded-full border border-emerald-500/30">
          <ShieldCheck className="w-4 h-4" />
          <span>প্রাইভেট এন্ড-টু-এন্ড এনক্রিপ্টেড কল (WebRTC P2P)</span>
        </div>

        {/* Contact Info & Video Avatar Box */}
        <div className="my-auto space-y-4 w-full">
          {isVideo ? (
            <div className="relative w-full h-56 rounded-3xl mx-auto overflow-hidden border-2 border-emerald-500/60 shadow-2xl bg-black flex items-center justify-center group">
              {/* Remote Video Stream */}
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />

              {/* Local Self Video Overlay Pip */}
              <div className="absolute top-3 right-3 w-20 h-28 bg-slate-900 rounded-xl border border-white/30 shadow-2xl overflow-hidden">
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover scale-x-[-1]"
                />
              </div>

              {/* Camera Switch button */}
              <button
                type="button"
                onClick={handleSwitchCamera}
                className="absolute bottom-3 right-3 p-2 bg-black/60 backdrop-blur-md rounded-xl text-white hover:text-emerald-400"
                title="Switch Camera"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="relative w-28 h-28 mx-auto">
              <span className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping" />
              <div className="relative w-28 h-28 rounded-full bg-slate-800 border-2 border-emerald-400 p-1 shadow-xl">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80"
                  alt={contactName}
                  className="w-full h-full rounded-full object-cover"
                />
              </div>
            </div>
          )}

          <div>
            <h3 className="text-xl font-extrabold text-white">{contactName}</h3>
            <p className="text-xs font-mono text-emerald-400 font-bold mt-1">
              {formatDuration(seconds)}
            </p>
          </div>
        </div>

        {/* Control Buttons Bar */}
        <div className="flex items-center justify-center gap-4 w-full pt-4 border-t border-slate-800/80">
          {/* Mute Toggle */}
          <button
            type="button"
            onClick={handleToggleMute}
            className={`w-12 h-12 rounded-full flex items-center justify-center text-slate-100 transition-colors ${
              isMuted ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40' : 'bg-slate-800 hover:bg-slate-700'
            }`}
            title="Mute Mic"
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Video Toggle */}
          <button
            type="button"
            onClick={handleToggleVideo}
            className={`w-12 h-12 rounded-full flex items-center justify-center text-slate-100 transition-colors ${
              !isVideo ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40' : 'bg-slate-800 hover:bg-slate-700'
            }`}
            title="Toggle Camera"
          >
            {isVideo ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </button>

          {/* Speaker Toggle */}
          <button
            type="button"
            onClick={() => {
              setIsSpeakerOn(!isSpeakerOn);
              sounds.playClickSound();
            }}
            className={`w-12 h-12 rounded-full flex items-center justify-center text-slate-100 transition-colors ${
              isSpeakerOn ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-slate-800'
            }`}
            title="Speakerphone"
          >
            <Volume2 className="w-5 h-5" />
          </button>

          {/* End Call Button */}
          <button
            type="button"
            onClick={handleEndCall}
            className="w-14 h-14 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-600/30 active:scale-95 transition-all"
            title="End Call"
          >
            <PhoneOff className="w-6 h-6" />
          </button>
        </div>

      </div>
    </div>
  );
};
