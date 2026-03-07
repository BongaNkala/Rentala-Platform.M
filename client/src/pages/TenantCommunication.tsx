import React, { useState, useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import RentalaLayout from '@/components/RentalaLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { MessageCircle, Send, User, Clock, Search, Plus, Reply, Archive, Star } from 'lucide-react';

interface Message {
  id: number;
  tenantId: number;
  tenantName: string;
  subject: string;
  content: string;
  timestamp: Date | string;
  isRead: boolean;
  isStarred: boolean;
  messageType: 'inquiry' | 'complaint' | 'maintenance' | 'payment' | 'general';
  priority: 'low' | 'medium' | 'high';
}

interface Conversation {
  id: number;
  tenantId: number;
  tenantName: string;
  lastMessage: string;
  lastMessageTime: Date | string;
  unreadCount: number;
  messageCount: number;
  isActive: boolean;
}

export default function TenantCommunication() {
  const [view, setView] = useState<'inbox' | 'conversations'>('inbox');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [replyContent, setReplyContent] = useState('');

  // Mock messages data
  const messages: Message[] = [
    {
      id: 1,
      tenantId: 1,
      tenantName: 'John Doe',
      subject: 'Plumbing Issue in Unit 4A',
      content: 'There is a leak in the bathroom sink. Please send a plumber as soon as possible.',
      timestamp: new Date('2026-03-07T10:30:00'),
      isRead: false,
      isStarred: false,
      messageType: 'maintenance',
      priority: 'high',
    },
    {
      id: 2,
      tenantId: 2,
      tenantName: 'Jane Smith',
      subject: 'Rent Payment Query',
      content: 'I would like to discuss a payment plan for the upcoming months.',
      timestamp: new Date('2026-03-07T09:15:00'),
      isRead: true,
      isStarred: true,
      messageType: 'payment',
      priority: 'medium',
    },
    {
      id: 3,
      tenantId: 3,
      tenantName: 'Mike Johnson',
      subject: 'Noise Complaint',
      content: 'There is excessive noise from the adjacent unit. Can you please address this?',
      timestamp: new Date('2026-03-06T14:45:00'),
      isRead: true,
      isStarred: false,
      messageType: 'complaint',
      priority: 'medium',
    },
  ];

  // Mock conversations data
  const conversations: Conversation[] = [
    {
      id: 1,
      tenantId: 1,
      tenantName: 'John Doe',
      lastMessage: 'Thank you for fixing the plumbing issue...',
      lastMessageTime: new Date('2026-03-07T10:30:00'),
      unreadCount: 1,
      messageCount: 5,
      isActive: true,
    },
    {
      id: 2,
      tenantId: 2,
      tenantName: 'Jane Smith',
      lastMessage: 'I will send you the payment plan details...',
      lastMessageTime: new Date('2026-03-07T09:15:00'),
      unreadCount: 0,
      messageCount: 8,
      isActive: true,
    },
  ];

  // Filter and search messages
  const filteredMessages = useMemo(() => {
    let result = messages;

    if (filterType) {
      result = result.filter(m => m.messageType === filterType);
    }

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      result = result.filter(m =>
        m.tenantName.toLowerCase().includes(search) ||
        m.subject.toLowerCase().includes(search) ||
        m.content.toLowerCase().includes(search)
      );
    }

    return result.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [filterType, searchTerm]);

  // Calculate stats
  const stats = useMemo(() => {
    const unread = messages.filter(m => !m.isRead).length;
    const starred = messages.filter(m => m.isStarred).length;
    const highPriority = messages.filter(m => m.priority === 'high').length;

    return { unread, starred, highPriority, total: messages.length };
  }, []);

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    const today = new Date();
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

    if (d.toDateString() === today.toDateString()) {
      return d.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' });
    } else if (d.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return d.toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' });
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'maintenance':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'complaint':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'payment':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'inquiry':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <RentalaLayout pageTitle="Tenant Communication" pageSubtitle="Manage tenant messages and conversations">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Tenant Communication</h1>
          <p className="text-gray-400">Centralized messaging with tenants</p>
        </div>
        <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white">
          <Plus size={18} className="mr-2" />
          New Message
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="bg-gradient-to-br from-blue-600/20 to-blue-400/10 border-blue-500/30 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Total Messages</p>
              <p className="text-3xl font-bold text-white">{stats.total}</p>
            </div>
            <div className="bg-blue-500/20 p-3 rounded-lg">
              <MessageCircle size={24} className="text-blue-400" />
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-red-600/20 to-red-400/10 border-red-500/30 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Unread</p>
              <p className="text-3xl font-bold text-white">{stats.unread}</p>
            </div>
            <div className="bg-red-500/20 p-3 rounded-lg">
              <MessageCircle size={24} className="text-red-400" />
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-600/20 to-yellow-400/10 border-yellow-500/30 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">High Priority</p>
              <p className="text-3xl font-bold text-white">{stats.highPriority}</p>
            </div>
            <div className="bg-yellow-500/20 p-3 rounded-lg">
              <MessageCircle size={24} className="text-yellow-400" />
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-purple-600/20 to-purple-400/10 border-purple-500/30 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Starred</p>
              <p className="text-3xl font-bold text-white">{stats.starred}</p>
            </div>
            <div className="bg-purple-500/20 p-3 rounded-lg">
              <Star size={24} className="text-purple-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* View Toggle */}
      <div className="flex gap-4 mb-8">
        <Button
          onClick={() => setView('inbox')}
          className={`${
            view === 'inbox'
              ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
              : 'bg-white/10 border border-white/20 text-gray-300 hover:bg-white/20'
          }`}
        >
          <MessageCircle size={16} className="mr-2" />
          Inbox
        </Button>
        <Button
          onClick={() => setView('conversations')}
          className={`${
            view === 'conversations'
              ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
              : 'bg-white/10 border border-white/20 text-gray-300 hover:bg-white/20'
          }`}
        >
          <User size={16} className="mr-2" />
          Conversations
        </Button>
      </div>

      {/* Filters */}
      <Card className="bg-white/5 border-white/10 p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-gray-300 text-sm mb-2">Search</label>
            <Input
              placeholder="Search messages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
            />
          </div>

          {view === 'inbox' && (
            <div>
              <label className="block text-gray-300 text-sm mb-2">Filter by Type</label>
              <select
                value={filterType || ''}
                onChange={(e) => setFilterType(e.target.value || null)}
                className="w-full bg-white/10 border border-white/20 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500"
              >
                <option value="">All Types</option>
                <option value="maintenance">Maintenance</option>
                <option value="complaint">Complaint</option>
                <option value="payment">Payment</option>
                <option value="inquiry">Inquiry</option>
                <option value="general">General</option>
              </select>
            </div>
          )}
        </div>
      </Card>

      {/* Inbox View */}
      {view === 'inbox' && (
        <div className="space-y-4">
          {filteredMessages.length === 0 ? (
            <Card className="bg-white/5 border-white/10 p-12 text-center">
              <MessageCircle size={48} className="mx-auto text-gray-600 mb-4" />
              <p className="text-gray-400 text-lg">No messages found</p>
            </Card>
          ) : (
            filteredMessages.map((message) => (
              <Card
                key={message.id}
                className={`bg-gradient-to-r from-white/5 to-white/[0.02] border-white/10 p-6 hover:border-purple-500/50 transition-all cursor-pointer ${
                  !message.isRead ? 'border-blue-500/50 bg-blue-500/5' : ''
                }`}
                onClick={() => setSelectedMessage(message)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white font-semibold">
                        {message.tenantName.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-white">{message.tenantName}</h3>
                          {!message.isRead && (
                            <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                          )}
                        </div>
                        <p className="text-gray-400 text-sm">{message.subject}</p>
                      </div>
                    </div>

                    <p className="text-gray-300 text-sm line-clamp-2 mb-3">{message.content}</p>

                    <div className="flex items-center gap-3">
                      <div className={`inline-flex items-center px-2 py-1 rounded border text-xs font-semibold ${getTypeColor(message.messageType)}`}>
                        <span className="capitalize">{message.messageType}</span>
                      </div>
                      <span className="text-gray-500 text-xs flex items-center gap-1">
                        <Clock size={12} />
                        {formatDate(message.timestamp)}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    {message.priority === 'high' && (
                      <div className="text-red-400 text-xs bg-red-500/10 px-2 py-1 rounded">
                        High Priority
                      </div>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-yellow-400"
                    >
                      <Star size={16} fill={message.isStarred ? 'currentColor' : 'none'} />
                    </button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Conversations View */}
      {view === 'conversations' && (
        <div className="space-y-4">
          {conversations.length === 0 ? (
            <Card className="bg-white/5 border-white/10 p-12 text-center">
              <MessageCircle size={48} className="mx-auto text-gray-600 mb-4" />
              <p className="text-gray-400 text-lg">No conversations yet</p>
            </Card>
          ) : (
            conversations.map((conversation) => (
              <Card
                key={conversation.id}
                className={`bg-gradient-to-r from-white/5 to-white/[0.02] border-white/10 p-6 hover:border-purple-500/50 transition-all cursor-pointer ${
                  conversation.unreadCount > 0 ? 'border-blue-500/50 bg-blue-500/5' : ''
                }`}
                onClick={() => setSelectedConversation(conversation)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white font-semibold text-lg">
                        {conversation.tenantName.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-white text-lg">{conversation.tenantName}</h3>
                          {conversation.unreadCount > 0 && (
                            <div className="bg-blue-500 text-white text-xs font-semibold px-2 py-1 rounded-full">
                              {conversation.unreadCount}
                            </div>
                          )}
                        </div>
                        <p className="text-gray-300 text-sm line-clamp-1">{conversation.lastMessage}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-gray-400 text-sm">
                      <span>{conversation.messageCount} messages</span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {formatDate(conversation.lastMessageTime)}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowReplyModal(true);
                    }}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
                  >
                    <Reply size={18} />
                  </button>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Reply Modal */}
      {showReplyModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-white/10 w-full max-w-2xl">
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold text-white">Reply to Message</h2>
                <button
                  onClick={() => setShowReplyModal(false)}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-gray-300 text-sm mb-2">Message</label>
                  <textarea
                    placeholder="Type your reply..."
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 text-white placeholder:text-gray-500 rounded-lg px-4 py-3 focus:outline-none focus:border-purple-500 min-h-32"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <Button
                  onClick={() => setShowReplyModal(false)}
                  variant="outline"
                  className="flex-1 border-white/20 text-white hover:bg-white/10"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    setShowReplyModal(false);
                    setReplyContent('');
                  }}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                >
                  <Send size={16} className="mr-2" />
                  Send Reply
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </RentalaLayout>
  );
}
