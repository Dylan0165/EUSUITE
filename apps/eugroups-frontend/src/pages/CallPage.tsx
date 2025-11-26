import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Users,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { callsApi } from '../api/client';

interface Participant {
  id: string;
  name: string;
  stream?: MediaStream;
}

export default function CallPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  
  const [callInfo, setCallInfo] = useState<{
    callId: number;
    callType: 'voice' | 'video';
    status: string;
  } | null>(null);
  
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [connecting, setConnecting] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());

  const API_BASE = import.meta.env.VITE_API_URL || '';
  
  // Self-hosted TURN/STUN server on your own K8s cluster
  // No external dependencies - full EU sovereignty
  const TURN_SERVER = import.meta.env.VITE_TURN_SERVER || '192.168.124.50';
  const TURN_USER = import.meta.env.VITE_TURN_USER || 'eugroups';
  const TURN_PASS = import.meta.env.VITE_TURN_PASS || 'EUGroupsTurn2024!';

  const iceServers = {
    iceServers: [
      // Your own STUN server (no credentials needed for STUN)
      { urls: `stun:${TURN_SERVER}:30478` },
      // Your own TURN server (UDP - best for media)
      {
        urls: `turn:${TURN_SERVER}:30478?transport=udp`,
        username: TURN_USER,
        credential: TURN_PASS,
      },
      // Your own TURN server (TCP - fallback for restrictive firewalls)
      {
        urls: `turn:${TURN_SERVER}:30479?transport=tcp`,
        username: TURN_USER,
        credential: TURN_PASS,
      },
    ],
  };

  const createPeerConnection = useCallback((peerId: string) => {
    const pc = new RTCPeerConnection(iceServers);
    
    // Add local stream tracks
    if (localStream) {
      localStream.getTracks().forEach((track) => {
        pc.addTrack(track, localStream);
      });
    }

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'ice-candidate',
          target: peerId,
          data: event.candidate,
        }));
      }
    };

    // Handle remote stream
    pc.ontrack = (event) => {
      setParticipants((prev) => {
        const existing = prev.find((p) => p.id === peerId);
        if (existing) {
          return prev.map((p) => 
            p.id === peerId ? { ...p, stream: event.streams[0] } : p
          );
        }
        return [...prev, { id: peerId, name: peerId, stream: event.streams[0] }];
      });
    };

    // Handle connection state
    pc.onconnectionstatechange = () => {
      console.log(`Connection state with ${peerId}:`, pc.connectionState);
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        peerConnectionsRef.current.delete(peerId);
        setParticipants((prev) => prev.filter((p) => p.id !== peerId));
      }
    };

    peerConnectionsRef.current.set(peerId, pc);
    return pc;
  }, [localStream]);

  const handleSignalingMessage = useCallback(async (message: any) => {
    const { type, from, data } = message;

    switch (type) {
      case 'user_joined': {
        // New user joined, create offer
        const pc = createPeerConnection(from);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: 'offer',
            target: from,
            data: offer,
          }));
        }
        break;
      }

      case 'offer': {
        // Received offer, create answer
        let pc = peerConnectionsRef.current.get(from);
        if (!pc) {
          pc = createPeerConnection(from);
        }
        
        await pc.setRemoteDescription(new RTCSessionDescription(data));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: 'answer',
            target: from,
            data: answer,
          }));
        }
        break;
      }

      case 'answer': {
        // Received answer
        const pc = peerConnectionsRef.current.get(from);
        if (pc) {
          await pc.setRemoteDescription(new RTCSessionDescription(data));
        }
        break;
      }

      case 'ice-candidate': {
        // Received ICE candidate
        const pc = peerConnectionsRef.current.get(from);
        if (pc && data) {
          await pc.addIceCandidate(new RTCIceCandidate(data));
        }
        break;
      }

      case 'user_left': {
        // User left
        const pc = peerConnectionsRef.current.get(from);
        if (pc) {
          pc.close();
          peerConnectionsRef.current.delete(from);
        }
        setParticipants((prev) => prev.filter((p) => p.id !== from));
        break;
      }

      case 'participants': {
        // Got list of participants, create connections to each
        for (const participantId of data.participants) {
          if (participantId !== 'me' && !peerConnectionsRef.current.has(participantId)) {
            const pc = createPeerConnection(participantId);
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            
            if (wsRef.current?.readyState === WebSocket.OPEN) {
              wsRef.current.send(JSON.stringify({
                type: 'offer',
                target: participantId,
                data: offer,
              }));
            }
          }
        }
        break;
      }
    }
  }, [createPeerConnection]);

  // Initialize media and WebSocket
  useEffect(() => {
    let mounted = true;

    const initCall = async () => {
      if (!roomId) {
        setError('No room ID provided');
        return;
      }

      try {
        // Get call info first
        // We'd need to look up call by room_id - for now we'll just get the media

        // Get user media
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        if (!mounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // Connect to signaling WebSocket
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = API_BASE 
          ? `${API_BASE.replace('http', 'ws')}/api/calls/signal/${roomId}`
          : `${wsProtocol}//${window.location.host}/api/calls/signal/${roomId}`;
        
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log('WebSocket connected');
          setConnecting(false);
          // Request list of participants
          ws.send(JSON.stringify({ type: 'get_participants' }));
        };

        ws.onmessage = (event) => {
          const message = JSON.parse(event.data);
          handleSignalingMessage(message);
        };

        ws.onerror = (err) => {
          console.error('WebSocket error:', err);
          setError('Connection error');
        };

        ws.onclose = () => {
          console.log('WebSocket closed');
        };

      } catch (err: any) {
        console.error('Failed to initialize call:', err);
        if (err.name === 'NotAllowedError') {
          setError('Camera/microphone access denied');
        } else {
          setError('Failed to start call');
        }
      }
    };

    initCall();

    return () => {
      mounted = false;
      // Cleanup
      if (localStream) {
        localStream.getTracks().forEach((t) => t.stop());
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
      peerConnectionsRef.current.forEach((pc) => pc.close());
      peerConnectionsRef.current.clear();
    };
  }, [roomId, handleSignalingMessage]);

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff(!isVideoOff);
    }
  };

  const endCall = async () => {
    // Cleanup
    if (localStream) {
      localStream.getTracks().forEach((t) => t.stop());
    }
    if (wsRef.current) {
      wsRef.current.close();
    }
    peerConnectionsRef.current.forEach((pc) => pc.close());
    
    // Navigate back
    navigate(-1);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center">
          <p className="text-xl mb-4">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2 bg-primary-500 rounded-lg hover:bg-primary-600"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-900 flex flex-col">
      {/* Video Grid */}
      <div className="flex-1 p-4 grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 auto-rows-fr">
        {/* Local Video */}
        <div className="relative bg-gray-800 rounded-xl overflow-hidden">
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className={`w-full h-full object-cover ${isVideoOff ? 'hidden' : ''}`}
          />
          {isVideoOff && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center">
                <VideoOff className="h-10 w-10 text-gray-400" />
              </div>
            </div>
          )}
          <div className="absolute bottom-3 left-3 px-3 py-1 bg-black/50 rounded-lg text-white text-sm">
            You {isMuted && <MicOff className="inline h-4 w-4 ml-1" />}
          </div>
        </div>

        {/* Remote Videos */}
        {participants.map((participant) => (
          <div key={participant.id} className="relative bg-gray-800 rounded-xl overflow-hidden">
            {participant.stream ? (
              <video
                autoPlay
                playsInline
                ref={(el) => {
                  if (el && participant.stream) {
                    el.srcObject = participant.stream;
                  }
                }}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center text-white text-2xl">
                  {participant.name.slice(0, 2).toUpperCase()}
                </div>
              </div>
            )}
            <div className="absolute bottom-3 left-3 px-3 py-1 bg-black/50 rounded-lg text-white text-sm">
              {participant.name}
            </div>
          </div>
        ))}

        {/* Connecting placeholder */}
        {connecting && (
          <div className="bg-gray-800 rounded-xl flex items-center justify-center">
            <div className="text-center text-white">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary-500 border-t-transparent mx-auto mb-3"></div>
              <p>Connecting...</p>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="p-6 bg-gray-800/50">
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={toggleMute}
            className={`p-4 rounded-full ${
              isMuted ? 'bg-red-500 text-white' : 'bg-gray-700 text-white hover:bg-gray-600'
            }`}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
          </button>

          <button
            onClick={toggleVideo}
            className={`p-4 rounded-full ${
              isVideoOff ? 'bg-red-500 text-white' : 'bg-gray-700 text-white hover:bg-gray-600'
            }`}
            title={isVideoOff ? 'Turn on camera' : 'Turn off camera'}
          >
            {isVideoOff ? <VideoOff className="h-6 w-6" /> : <Video className="h-6 w-6" />}
          </button>

          <button
            onClick={endCall}
            className="p-4 rounded-full bg-red-500 text-white hover:bg-red-600"
            title="End call"
          >
            <PhoneOff className="h-6 w-6" />
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-4 rounded-full bg-gray-700 text-white hover:bg-gray-600"
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="h-6 w-6" /> : <Maximize2 className="h-6 w-6" />}
          </button>

          <div className="px-4 py-2 bg-gray-700 rounded-full text-white flex items-center gap-2">
            <Users className="h-5 w-5" />
            <span>{participants.length + 1}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
