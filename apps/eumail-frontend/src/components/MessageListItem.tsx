import { Link } from 'react-router-dom';
import { Mail, MailOpen } from 'lucide-react';
import type { MailPreview } from '../api/mailApi';

interface MessageListItemProps {
  message: MailPreview;
  type?: 'inbox' | 'sent';
}

export function MessageListItem({ message, type = 'inbox' }: MessageListItemProps) {
  const formattedDate = new Date(message.created_at).toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <Link
      to={`/mail/read/${message.id}`}
      className={`flex items-center gap-4 p-4 border-b border-gray-100 hover:bg-purple-50 transition-colors ${
        !message.is_read && type === 'inbox' ? 'bg-purple-50/50' : 'bg-white'
      }`}
    >
      {/* Icon */}
      <div className={`p-2 rounded-full ${message.is_read ? 'bg-gray-100' : 'bg-purple-100'}`}>
        {message.is_read ? (
          <MailOpen size={20} className="text-gray-500" />
        ) : (
          <Mail size={20} className="text-purple-600" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`text-sm ${message.is_read ? 'text-gray-600' : 'text-gray-900 font-semibold'}`}>
            {type === 'inbox' 
              ? (message.sender_username || message.sender_email)
              : message.sender_email /* In sent view, sender_email contains recipient */
            }
          </span>
          {!message.is_read && type === 'inbox' && (
            <span className="px-2 py-0.5 text-xs bg-purple-600 text-white rounded-full">
              Nieuw
            </span>
          )}
        </div>
        <p className={`text-sm truncate ${message.is_read ? 'text-gray-500' : 'text-gray-700 font-medium'}`}>
          {message.subject}
        </p>
      </div>

      {/* Date */}
      <span className="text-xs text-gray-400 whitespace-nowrap">
        {formattedDate}
      </span>
    </Link>
  );
}
