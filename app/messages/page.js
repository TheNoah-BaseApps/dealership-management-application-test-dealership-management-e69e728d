'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import MessageForm from '@/components/messages/MessageForm';
import MessageList from '@/components/messages/MessageList';
import { Plus, MessageSquare, Mail, MailOpen } from 'lucide-react';
import { toast } from 'sonner';

export default function MessagesPage() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showComposeDialog, setShowComposeDialog] = useState(false);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/communications', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch messages');

      const data = await response.json();
      setMessages(data.data || []);
      setError(null);
    } catch (err) {
      setError(err.message);
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const handleComposeSuccess = () => {
    setShowComposeDialog(false);
    fetchMessages();
    toast.success('Message sent successfully');
  };

  const unreadCount = messages.filter(m => !m.read_status).length;

  const stats = [
    { label: 'Total Messages', value: messages.length, icon: MessageSquare, color: 'blue' },
    { label: 'Unread', value: unreadCount, icon: Mail, color: 'orange' },
    { label: 'Read', value: messages.length - unreadCount, icon: MailOpen, color: 'green' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Internal Messages</h1>
          <p className="text-slate-600">Team communication and notifications</p>
        </div>
        <Button onClick={() => setShowComposeDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Compose Message
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
                <stat.icon className={`h-8 w-8 text-${stat.color}-600`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {loading ? (
        <Skeleton className="h-96" />
      ) : error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : (
        <MessageList messages={messages} onRefresh={fetchMessages} />
      )}

      <Dialog open={showComposeDialog} onOpenChange={setShowComposeDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Compose Message</DialogTitle>
          </DialogHeader>
          <MessageForm onSuccess={handleComposeSuccess} />
        </DialogContent>
      </Dialog>
    </div>
  );
}