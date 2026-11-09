import { 
  collection, 
  doc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  onSnapshot, 
  getDoc,
  getDocs,
  query,
  where
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserProfile, CallLog } from '../types/chat';

// Public STUN servers for WebRTC P2P NAT Traversal
const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

export interface ActiveCallData {
  callId: string;
  callerId: string;
  callerName: string;
  callerAvatar: string;
  receiverId: string;
  receiverName: string;
  isVideo: boolean;
  status: 'ringing' | 'accepted' | 'declined' | 'ended' | 'busy';
  createdAt: string;
  offer?: RTCSessionDescriptionInit;
  answer?: RTCSessionDescriptionInit;
}

export class WebRTCService {
  private pc: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private unsubscribeCallDoc: (() => void) | null = null;
  private unsubscribeCandidates: (() => void) | null = null;

  // Initialize WebRTC PeerConnection
  private createPeerConnection(
    onRemoteStream: (stream: MediaStream) => void,
    onIceCandidate: (candidate: RTCIceCandidate) => void
  ): RTCPeerConnection {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    this.remoteStream = new MediaStream();
    onRemoteStream(this.remoteStream);

    // Collect remote tracks
    pc.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => {
        if (this.remoteStream) {
          this.remoteStream.addTrack(track);
        }
      });
    };

    // ICE candidate generation
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        onIceCandidate(event.candidate);
      }
    };

    this.pc = pc;
    return pc;
  }

  // Acquire Local Camera & Microphone Stream
  async getLocalMediaStream(isVideo: boolean): Promise<MediaStream> {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('WebRTC media device access is not supported on this device.');
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: isVideo ? { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } } : false,
    });
    this.localStream = stream;
    return stream;
  }

  // 1. Caller: Start Outgoing WebRTC Call
  async startCall(
    caller: UserProfile,
    receiver: UserProfile,
    isVideo: boolean,
    onRemoteStream: (stream: MediaStream) => void,
    onStatusChange: (status: ActiveCallData['status']) => void
  ): Promise<string> {
    const callDocRef = doc(collection(db, 'calls'));
    const callId = callDocRef.id;

    // Get local camera/mic stream
    const localStream = await this.getLocalMediaStream(isVideo);

    // Create RTCPeerConnection
    const pc = this.createPeerConnection(onRemoteStream, (candidate) => {
      // Send candidate to Firestore
      const candidateCol = collection(db, 'calls', callId, 'callerCandidates');
      addDoc(candidateCol, candidate.toJSON());
    });

    // Add local tracks to PeerConnection
    localStream.getTracks().forEach((track) => {
      pc.addTrack(track, localStream);
    });

    // Create SDP Offer
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    // Save call document to Firestore
    const callData: ActiveCallData = {
      callId,
      callerId: caller.id,
      callerName: caller.name,
      callerAvatar: caller.avatar,
      receiverId: receiver.id,
      receiverName: receiver.name,
      isVideo,
      status: 'ringing',
      createdAt: new Date().toISOString(),
      offer: { type: offer.type, sdp: offer.sdp },
    };

    await setDoc(callDocRef, callData);

    // Listen for call status changes & SDP Answer from Callee
    this.unsubscribeCallDoc = onSnapshot(callDocRef, async (snapshot) => {
      const data = snapshot.data() as ActiveCallData | undefined;
      if (!data) return;

      onStatusChange(data.status);

      if (data.status === 'accepted' && data.answer && !pc.currentRemoteDescription) {
        const rsd = new RTCSessionDescription(data.answer);
        await pc.setRemoteDescription(rsd);
      }

      if (data.status === 'declined' || data.status === 'ended' || data.status === 'busy') {
        this.endCall(callId);
      }
    });

    // Listen for Callee ICE Candidates
    const calleeCandidatesCol = collection(db, 'calls', callId, 'calleeCandidates');
    this.unsubscribeCandidates = onSnapshot(calleeCandidatesCol, (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        if (change.type === 'added') {
          const candidateData = change.doc.data();
          const candidate = new RTCIceCandidate(candidateData);
          await pc.addIceCandidate(candidate);
        }
      });
    });

    return callId;
  }

  // 2. Callee: Accept Incoming WebRTC Call
  async acceptCall(
    callData: ActiveCallData,
    onRemoteStream: (stream: MediaStream) => void,
    onStatusChange: (status: ActiveCallData['status']) => void
  ): Promise<void> {
    const callId = callData.callId;
    const callDocRef = doc(db, 'calls', callId);

    // Get local stream
    const localStream = await this.getLocalMediaStream(callData.isVideo);

    // Create RTCPeerConnection
    const pc = this.createPeerConnection(onRemoteStream, (candidate) => {
      const candidateCol = collection(db, 'calls', callId, 'calleeCandidates');
      addDoc(candidateCol, candidate.toJSON());
    });

    // Add local tracks to PeerConnection
    localStream.getTracks().forEach((track) => {
      pc.addTrack(track, localStream);
    });

    // Set Remote Description from Caller Offer
    if (callData.offer) {
      await pc.setRemoteDescription(new RTCSessionDescription(callData.offer));
    }

    // Create SDP Answer
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    // Update Firestore with Answer and Accepted status
    await updateDoc(callDocRef, {
      status: 'accepted',
      answer: { type: answer.type, sdp: answer.sdp },
    });

    // Listen for Call Status updates (e.g. caller ends call)
    this.unsubscribeCallDoc = onSnapshot(callDocRef, (snapshot) => {
      const updated = snapshot.data() as ActiveCallData | undefined;
      if (updated) {
        onStatusChange(updated.status);
        if (updated.status === 'ended' || updated.status === 'declined') {
          this.endCall(callId);
        }
      }
    });

    // Listen for Caller ICE Candidates
    const callerCandidatesCol = collection(db, 'calls', callId, 'callerCandidates');
    this.unsubscribeCandidates = onSnapshot(callerCandidatesCol, (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        if (change.type === 'added') {
          const candidateData = change.doc.data();
          const candidate = new RTCIceCandidate(candidateData);
          await pc.addIceCandidate(candidate);
        }
      });
    });
  }

  // 3. Decline Incoming Call
  async declineCall(callId: string): Promise<void> {
    const callDocRef = doc(db, 'calls', callId);
    try {
      await updateDoc(callDocRef, { status: 'declined' });
    } catch (e) {
      console.warn('Decline call update note:', e);
    }
  }

  // 4. End Call and Clean Up Camera/Mic Tracks
  async endCall(callId: string): Promise<void> {
    if (callId) {
      try {
        const callDocRef = doc(db, 'calls', callId);
        await updateDoc(callDocRef, { status: 'ended' });
      } catch (e) {
        console.warn('End call update note:', e);
      }
    }

    // Stop all camera and mic tracks immediately
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }

    if (this.remoteStream) {
      this.remoteStream.getTracks().forEach((track) => track.stop());
      this.remoteStream = null;
    }

    if (this.pc) {
      this.pc.close();
      this.pc = null;
    }

    if (this.unsubscribeCallDoc) {
      this.unsubscribeCallDoc();
      this.unsubscribeCallDoc = null;
    }

    if (this.unsubscribeCandidates) {
      this.unsubscribeCandidates();
      this.unsubscribeCandidates = null;
    }
  }

  // Toggle Mute Audio
  toggleMute(isMuted: boolean) {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((track) => {
        track.enabled = !isMuted;
      });
    }
  }

  // Toggle Video Off
  toggleVideo(isVideoOff: boolean) {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach((track) => {
        track.enabled = !isVideoOff;
      });
    }
  }

  // Switch Camera Facing Mode
  async switchCamera(facingMode: 'user' | 'environment'): Promise<MediaStream | null> {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach((track) => track.stop());
    }

    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: { facingMode },
      });
      this.localStream = newStream;

      if (this.pc) {
        const videoTrack = newStream.getVideoTracks()[0];
        const sender = this.pc.getSenders().find((s) => s.track?.kind === 'video');
        if (sender && videoTrack) {
          sender.replaceTrack(videoTrack);
        }
      }
      return newStream;
    } catch (e) {
      console.warn('Switch camera note:', e);
      return null;
    }
  }
}

export const webRTC = new WebRTCService();

// Real-Time Incoming Call Listener for Receiver User
export function subscribeToIncomingCalls(
  currentUserId: string,
  onIncomingCall: (callData: ActiveCallData) => void
) {
  const callsCol = collection(db, 'calls');
  const q = query(
    callsCol, 
    where('receiverId', '==', currentUserId), 
    where('status', '==', 'ringing')
  );

  return onSnapshot(q, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        const callData = change.doc.data() as ActiveCallData;
        onIncomingCall(callData);
      }
    });
  });
}
