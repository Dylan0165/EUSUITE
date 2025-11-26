import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Phone,
  Video,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  Clock,
} from 'lucide-react';
import { callsApi } from '../api/client';
import type { CallHistoryItem } from '../types';

export default function CallHistoryPage() {
  const navigate = useNavigate();
  const [calls, setCalls] = useState<CallHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCallHistory();
  }, []);

  const loadCallHistory = async () => {
    try {
      setLoading(true);
      const response = await callsApi.getCallHistory();
      setCalls(response.calls);
    } catch (err) {
      console.error('Failed to load call history:', err);
    } finally {
      setLoading(false);
    }
  };

  const getCallIcon = (call: CallHistoryItem) => {
    if (call.status === 'missed') {
      return <PhoneMissed className="h-5 w-5 text-red-500" />;
    }
    if (call.was_initiator) {
      return <PhoneOutgoing className="h-5 w-5 text-green-500" />;
    }
    return <PhoneIncoming className="h-5 w-5 text-blue-500" />;
  };

  const getCallTypeIcon = (type: 'voice' | 'video') => {
    return type === 'video' ? (
      <Video className="h-4 w-4 text-gray-400" />
    ) : (
      <Phone className="h-4 w-4 text-gray-400" />
    );
  };

  const formatDuration = (start: string, end: string | null) => {
    if (!end) return 'Ongoing';
    const duration = new Date(end).getTime() - new Date(start).getTime();
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    if (minutes === 0) return `${seconds}s`;
    return `${minutes}m ${seconds}s`;
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'long' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const getParticipantName = (call: CallHistoryItem) => {
    if (call.participants.length === 0) return 'Unknown';
    return call.participants.map((p) => p.user_name || 'Unknown').join(', ');
  };

  const handleCallback = async (call: CallHistoryItem) => {
    try {
      const result = await callsApi.startCall(call.call_type, {
        targetUserId: call.participants[0]?.user_id,
      });
      navigate(`/call/${result.room_id}`);
    } catch (err) {
      console.error('Failed to start call:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-50 overflow-y-auto">
      <div className="max-w-3xl mx-auto p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Call History</h1>

        {calls.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <Phone className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No calls yet</h3>
            <p className="text-gray-500">Your call history will appear here</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm divide-y divide-gray-100">
            {calls.map((call) => (
              <div
                key={call.id}
                className="p-4 hover:bg-gray-50 flex items-center gap-4"
              >
                {/* Call direction icon */}
                <div className="flex-shrink-0">{getCallIcon(call)}</div>

                {/* Call info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 truncate">
                      {getParticipantName(call)}
                    </span>
                    {getCallTypeIcon(call.call_type)}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span>{formatTime(call.started_at)}</span>
                    {call.status === 'ended' && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDuration(call.started_at, call.ended_at)}
                        </span>
                      </>
                    )}
                    {call.status === 'missed' && (
                      <span className="text-red-500">Missed</span>
                    )}
                    {call.status === 'declined' && (
                      <span className="text-orange-500">Declined</span>
                    )}
                  </div>
                </div>

                {/* Callback button */}
                <button
                  onClick={() => handleCallback(call)}
                  className="p-2 hover:bg-gray-100 rounded-lg text-primary-500"
                  title={`Call back (${call.call_type})`}
                >
                  {call.call_type === 'video' ? (
                    <Video className="h-5 w-5" />
                  ) : (
                    <Phone className="h-5 w-5" />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
