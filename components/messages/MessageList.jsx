'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils/date';
import { Mail, MailOpen } from 'lucide-react';

export default function MessageList({ messages, onRefresh }) {
  const handleMarkRead = async (messageId) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/communications/${messageId}/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      onRefresh();
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  if (messages.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-slate-500">
          No messages
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {messages.map((message) => (
        <Card
          key={message.communication_id}
          className={`cursor-pointer hover:shadow-md transition-shadow ${
            !message.read_status ? 'bg-blue-50' : ''
          }`}
          onClick={() => handleMarkRead(message.id)}
        >
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              {message.read_status ? (
                <MailOpen className="h-5 w-5 text-slate-400" />
              ) : (
                <Mail className="h-5 w-5 text-blue-600" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h4 className={`font-medium ${!message.read_status ? 'font-bold' : ''}`}>
                    {message.subject}
                  </h4>
                  <span className="text-xs text-slate-500 flex-shrink-0">
                    {formatDate(message.created_at)}
                  </span>
                </div>
                <p className="text-sm text-slate-600 mb-2">From: {message.sender_name}</p>
                <p className="text-sm text-slate-700 line-clamp-2">{message.message}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}