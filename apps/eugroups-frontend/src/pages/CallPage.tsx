import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
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
import * as mediasoupClient from 'mediasoup-client';

interface Peer {
  id: string;
  odId: string;
  name: string;
  videoStream?: MediaStream;
  audioStream?: MediaStream;
}

export default function CallPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const callType = (searchParams.get('type') || 'video') as 'voice' | 'video';
  
  const [peers, setPeers] = useState<Peer[]>([]);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(callType === 'voice');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [connecting, setConnecting] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [myPeerId, setMyPeerId] = useState<string | null>(null);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const deviceRef = useRef<mediasoupClient.Device | null>(null);
  const sendTransportRef = useRef<mediasoupClient.types.Transport | null>(null);
  const recvTransportRef = useRef<mediasoupClient.types.Transport | null>(null);
  const producersRef = useRef<Map<string, mediasoupClient.types.Producer>>(new Map());
  const consumersRef = useRef<Map<string, mediasoupClient.types.Consumer>>(new Map());

  // Media server URL - self-hosted on your VM (100% EU, no American services)
  const MEDIA_SERVER = import.meta.env.VITE_MEDIA_SERVER || 'ws://192.168.124.50:30650/ws';

  // Send message to server
  const send = (message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  };

  // Initialize media and connect to server
  useEffect(() => {
    if (!roomId) return;

    let mounted = true;

    const init = async () => {
      try {
        // Get local media
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: callType === 'video',
        });

        if (!mounted) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        setLocalStream(stream);

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // Connect to media server
        await connectToMediaServer(stream);
        setConnecting(false);
      } catch (err: any) {
        console.error('Init error:', err);
        setError(err.message || 'Kon geen verbinding maken');
        setConnecting(false);
      }
    };

    init();

    return () => {
      mounted = false;
      cleanup();
    };
  }, [roomId, callType]);

  // Connect to mediasoup server
  const connectToMediaServer = async (stream: MediaStream) => {
    return new Promise<void>((resolve, reject) => {
      const ws = new WebSocket(`${MEDIA_SERVER}?roomId=${roomId}`);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('✅ Connected to media server');
      };

      ws.onclose = (e) => {
        console.log('WebSocket closed:', e.reason);
        if (e.code !== 1000) {
          setError('Verbinding verbroken');
        }
      };

      ws.onerror = () => {
        reject(new Error('WebSocket verbinding mislukt'));
      };

      ws.onmessage = async (event) => {
        const message = JSON.parse(event.data);
        await handleServerMessage(message, stream, resolve, reject);
      };
    });
  };

  // Handle messages from media server
  const handleServerMessage = async (
    message: any,
    localStreamParam: MediaStream,
    resolve?: () => void,
    _reject?: (err: Error) => void
  ) => {
    const { type } = message;

    switch (type) {
      case 'welcome': {
        const { peerId, rtpCapabilities, peers: existingPeers } = message;
        setMyPeerId(peerId);

        // Initialize mediasoup device
        const device = new mediasoupClient.Device();
        await device.load({ routerRtpCapabilities: rtpCapabilities });
        deviceRef.current = device;

        // Add existing peers
        setPeers(existingPeers.map((p: any) => ({
          id: p.id,
          odId: p.odId,
          name: p.name,
        })));

        // Create transports
        await createSendTransport(localStreamParam);
        await createRecvTransport();

        // Get existing producers
        send({ type: 'get-producers' });

        resolve?.();
        break;
      }

      case 'transport-created': {
        const { direction, transportId, iceParameters, iceCandidates, dtlsParameters } = message;

        if (direction === 'send' && deviceRef.current) {
          const transport = deviceRef.current.createSendTransport({
            id: transportId,
            iceParameters,
            iceCandidates,
            dtlsParameters,
          });

          transport.on('connect', ({ dtlsParameters: dtls }, callback) => {
            send({ type: 'connect-transport', transportId, dtlsParameters: dtls });
            const handler = (e: MessageEvent) => {
              const msg = JSON.parse(e.data);
              if (msg.type === 'transport-connected' && msg.transportId === transportId) {
                wsRef.current?.removeEventListener('message', handler);
                callback();
              }
            };
            wsRef.current?.addEventListener('message', handler);
          });

          transport.on('produce', ({ kind, rtpParameters, appData }, callback) => {
            send({ type: 'produce', transportId, kind, rtpParameters, appData });
            const handler = (e: MessageEvent) => {
              const msg = JSON.parse(e.data);
              if (msg.type === 'produced' && msg.kind === kind) {
                wsRef.current?.removeEventListener('message', handler);
                callback({ id: msg.producerId });
              }
            };
            wsRef.current?.addEventListener('message', handler);
          });

          sendTransportRef.current = transport;
        }

        if (direction === 'recv' && deviceRef.current) {
          const transport = deviceRef.current.createRecvTransport({
            id: transportId,
            iceParameters,
            iceCandidates,
            dtlsParameters,
          });

          transport.on('connect', ({ dtlsParameters: dtls }, callback) => {
            send({ type: 'connect-transport', transportId, dtlsParameters: dtls });
            const handler = (e: MessageEvent) => {
              const msg = JSON.parse(e.data);
              if (msg.type === 'transport-connected' && msg.transportId === transportId) {
                wsRef.current?.removeEventListener('message', handler);
                callback();
              }
            };
            wsRef.current?.addEventListener('message', handler);
          });

          recvTransportRef.current = transport;
        }
        break;
      }

      case 'peer-joined': {
        const { peerId, odId, userName } = message;
        setPeers(prev => [...prev, { id: peerId, odId, name: userName }]);
        break;
      }

      case 'peer-left': {
        const { peerId } = message;
        setPeers(prev => prev.filter(p => p.id !== peerId));
        for (const [consumerId, consumer] of consumersRef.current) {
          if (consumer.appData?.peerId === peerId) {
            consumer.close();
            consumersRef.current.delete(consumerId);
          }
        }
        break;
      }

      case 'producers-list': {
        const { producers } = message;
        for (const producer of producers) {
          await consumeProducer(producer);
        }
        break;
      }

      case 'new-producer': {
        await consumeProducer(message);
        break;
      }

      case 'consumed': {
        const { consumerId, producerId, kind, rtpParameters, producerPeerId, producerUserName } = message;

        if (!recvTransportRef.current) return;

        const consumer = await recvTransportRef.current.consume({
          id: consumerId,
          producerId,
          kind,
          rtpParameters,
        });

        consumer.appData.peerId = producerPeerId;
        consumersRef.current.set(consumerId, consumer);

        const stream = new MediaStream([consumer.track]);

        setPeers(prev => prev.map(p => {
          if (p.id === producerPeerId) {
            return {
              ...p,
              [kind === 'video' ? 'videoStream' : 'audioStream']: stream,
            };
          }
          return p;
        }));

        send({ type: 'resume-consumer', consumerId });
        break;
      }

      case 'producer-closed': {
        const { producerId } = message;
        for (const [consumerId, consumer] of consumersRef.current) {
          if (consumer.producerId === producerId) {
            consumer.close();
            consumersRef.current.delete(consumerId);
          }
        }
        break;
      }

      case 'consumer-closed': {
        const { consumerId } = message;
        const consumer = consumersRef.current.get(consumerId);
        if (consumer) {
          consumer.close();
          consumersRef.current.delete(consumerId);
        }
        break;
      }

      case 'error': {
        console.error('Server error:', message.message);
        setError(message.message);
        break;
      }
    }
  };

  // Create send transport and produce media
  const createSendTransport = async (stream: MediaStream) => {
    send({ type: 'create-transport', direction: 'send' });

    await new Promise<void>((resolve) => {
      const checkTransport = setInterval(async () => {
        if (sendTransportRef.current) {
          clearInterval(checkTransport);

          const audioTrack = stream.getAudioTracks()[0];
          if (audioTrack) {
            const audioProducer = await sendTransportRef.current!.produce({
              track: audioTrack,
            });
            producersRef.current.set('audio', audioProducer);
          }

          const videoTrack = stream.getVideoTracks()[0];
          if (videoTrack) {
            const videoProducer = await sendTransportRef.current!.produce({
              track: videoTrack,
              encodings: [
                { maxBitrate: 100000, scaleResolutionDownBy: 4 },
                { maxBitrate: 300000, scaleResolutionDownBy: 2 },
                { maxBitrate: 900000 },
              ],
              codecOptions: {
                videoGoogleStartBitrate: 1000,
              },
            });
            producersRef.current.set('video', videoProducer);
          }

          resolve();
        }
      }, 100);
    });
  };

  // Create receive transport
  const createRecvTransport = async () => {
    send({ type: 'create-transport', direction: 'recv' });

    await new Promise<void>((resolve) => {
      const checkTransport = setInterval(() => {
        if (recvTransportRef.current) {
          clearInterval(checkTransport);
          resolve();
        }
      }, 100);
    });
  };

  // Consume a remote producer
  const consumeProducer = async (producer: any) => {
    if (!deviceRef.current) return;

    send({
      type: 'consume',
      producerId: producer.producerId,
      rtpCapabilities: deviceRef.current.rtpCapabilities,
    });
  };

  // Toggle mute
  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = isMuted;
      });
      setIsMuted(!isMuted);
    }
  };

  // Toggle video
  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = isVideoOff;
      });
      setIsVideoOff(!isVideoOff);

      const videoProducer = producersRef.current.get('video');
      if (videoProducer) {
        if (isVideoOff) {
          videoProducer.resume();
        } else {
          videoProducer.pause();
        }
      }
    }
  };

  // End call
  const endCall = () => {
    cleanup();
    navigate('/calls');
  };

  // Cleanup resources
  const cleanup = () => {
    for (const producer of producersRef.current.values()) {
      producer.close();
    }
    producersRef.current.clear();

    for (const consumer of consumersRef.current.values()) {
      consumer.close();
    }
    consumersRef.current.clear();

    sendTransportRef.current?.close();
    recvTransportRef.current?.close();

    wsRef.current?.close();

    localStream?.getTracks().forEach(track => track.stop());
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Loading state
  if (connecting) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-white text-lg">Verbinding maken...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <PhoneOff className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-white text-xl mb-2">Oproep mislukt</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => navigate('/calls')}
            className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
          >
            Terug
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Video Grid */}
      <div className="flex-1 p-4">
        <div className={`grid gap-4 h-full ${
          peers.length === 0 ? 'grid-cols-1' :
          peers.length === 1 ? 'grid-cols-2' :
          peers.length <= 3 ? 'grid-cols-2' :
          'grid-cols-3'
        }`}>
          {/* Local video */}
          <div className="relative bg-gray-800 rounded-2xl overflow-hidden min-h-[300px]">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className={`w-full h-full object-cover ${isVideoOff ? 'hidden' : ''}`}
            />
            {isVideoOff && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-24 h-24 rounded-full bg-primary-500 flex items-center justify-center">
                  <span className="text-4xl font-bold text-white">Jij</span>
                </div>
              </div>
            )}
            <div className="absolute bottom-4 left-4 px-3 py-1 bg-black/50 rounded-lg">
              <span className="text-white text-sm">Jij {isMuted && '(gedempt)'}</span>
            </div>
          </div>

          {/* Remote videos */}
          {peers.map((peer) => (
            <div key={peer.id} className="relative bg-gray-800 rounded-2xl overflow-hidden min-h-[300px]">
              {peer.videoStream ? (
                <video
                  autoPlay
                  playsInline
                  ref={(el) => {
                    if (el && peer.videoStream) {
                      el.srcObject = peer.videoStream;
                    }
                  }}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-24 h-24 rounded-full bg-gray-700 flex items-center justify-center">
                    <span className="text-4xl font-bold text-white">
                      {(peer.name || 'U')[0].toUpperCase()}
                    </span>
                  </div>
                </div>
              )}
              {peer.audioStream && (
                <audio
                  autoPlay
                  ref={(el) => {
                    if (el && peer.audioStream) {
                      el.srcObject = peer.audioStream;
                    }
                  }}
                />
              )}
              <div className="absolute bottom-4 left-4 px-3 py-1 bg-black/50 rounded-lg">
                <span className="text-white text-sm">{peer.name || 'Gebruiker'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="p-6 bg-gray-800/50">
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={toggleMute}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
              isMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            {isMuted ? <MicOff className="w-6 h-6 text-white" /> : <Mic className="w-6 h-6 text-white" />}
          </button>

          {callType === 'video' && (
            <button
              onClick={toggleVideo}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                isVideoOff ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              {isVideoOff ? <VideoOff className="w-6 h-6 text-white" /> : <Video className="w-6 h-6 text-white" />}
            </button>
          )}

          <button
            onClick={endCall}
            className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-all"
          >
            <PhoneOff className="w-6 h-6 text-white" />
          </button>

          <button
            onClick={toggleFullscreen}
            className="w-14 h-14 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center transition-all"
          >
            {isFullscreen ? <Minimize2 className="w-6 h-6 text-white" /> : <Maximize2 className="w-6 h-6 text-white" />}
          </button>

          <div className="w-14 h-14 rounded-full bg-gray-700 flex items-center justify-center">
            <Users className="w-5 h-5 text-white" />
            <span className="text-white text-sm ml-1">{peers.length + 1}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
