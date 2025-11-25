import { useState, useEffect } from 'react';
import { Send, RefreshCw } from 'lucide-react';
import { MessageListItem } from '../components/MessageListItem';
import { getSent, type MailPreview } from '../api/mailApi';

export function Sent() {
  const [messages, setMessages] = useState<MailPreview[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSent = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getSent();
      setMessages(data.messages);
      setTotal(data.total);
    } catch (err) {
      setError('Kon verzonden berichten niet laden');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSent();
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Send className="text-purple-600" size={24} />
          <h1 className="text-xl font-semibold text-gray-800">Verzonden</h1>
        </div>
        <button
          onClick={fetchSent}
          disabled={loading}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw size={20} className={`text-gray-600 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Messages */}
      <div className="divide-y divide-gray-100">
        {loading && messages.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <RefreshCw size={32} className="mx-auto mb-4 animate-spin text-purple-600" />
            <p>Verzonden berichten laden...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-red-500">{error}</p>
            <button
              onClick={fetchSent}
              className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Opnieuw proberen
            </button>
          </div>
        ) : messages.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Send size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">Geen verzonden berichten</p>
            <p className="text-sm">Je hebt nog geen berichten verzonden</p>
          </div>
        ) : (
          messages.map((message) => (
            <MessageListItem key={message.id} message={message} type="sent" />
          ))
        )}
      </div>

      {/* Footer */}
      {total > 0 && (
        <div className="p-4 border-t border-gray-200 text-sm text-gray-500 text-center">
          {total} verzonden berichten
        </div>
      )}
    </div>
  );
}
