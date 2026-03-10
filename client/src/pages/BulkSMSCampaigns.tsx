import React, { useState, useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  MessageSquare,
  Plus,
  Send,
  Trash2,
  Eye,
  Clock,
  CheckCircle,
  AlertCircle,
  BarChart3,
  Search,
  Filter,
} from 'lucide-react';

interface Campaign {
  id: number;
  name: string;
  description: string | null;
  messageTemplate: string;
  status: 'draft' | 'scheduled' | 'sent' | 'cancelled';
  recipientCount: number | null;
  sentCount: number | null;
  deliveredCount: number | null;
  failedCount: number | null;
  scheduledTime: Date | null;
  sentAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export default function BulkSMSCampaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    messageTemplate: '',
    recipientIds: [] as number[],
    scheduledTime: '',
  });

  const [selectedTenants, setSelectedTenants] = useState<number[]>([]);
  const [showRecipientSelector, setShowRecipientSelector] = useState(false);

  // tRPC queries and mutations
  const { data: campaignsList } = trpc.smsCampaigns.list.useQuery({
    limit: 100,
    offset: 0,
  });

  const createMutation = trpc.smsCampaigns.create.useMutation({
    onSuccess: () => {
      setFormData({
        name: '',
        description: '',
        messageTemplate: '',
        recipientIds: [],
        scheduledTime: '',
      });
      setSelectedTenants([]);
      setShowCreateForm(false);
      // Refetch campaigns
      trpc.smsCampaigns.list.useQuery({ limit: 100, offset: 0 });
    },
  });

  const sendMutation = trpc.smsCampaigns.send.useMutation({
    onSuccess: () => {
      // Refetch campaigns
      trpc.smsCampaigns.list.useQuery({ limit: 100, offset: 0 });
    },
  });

  const deleteMutation = trpc.smsCampaigns.delete.useMutation({
    onSuccess: () => {
      // Refetch campaigns
      trpc.smsCampaigns.list.useQuery({ limit: 100, offset: 0 });
    },
  });

  const { data: analytics } = trpc.smsCampaigns.getAnalytics.useQuery(
    { id: selectedCampaign?.id || 0 },
    { enabled: !!selectedCampaign }
  );

  // Filter and search campaigns
  const filteredCampaigns = useMemo(() => {
    if (!campaignsList) return [];

    return campaignsList.filter((campaign) => {
      const matchesSearch =
        campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        campaign.description?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [campaignsList, searchTerm, statusFilter]);

  const handleCreateCampaign = async () => {
    if (!formData.name || !formData.messageTemplate || selectedTenants.length === 0) {
      alert('Please fill in all required fields');
      return;
    }

    await createMutation.mutateAsync({
      name: formData.name,
      description: formData.description,
      messageTemplate: formData.messageTemplate,
      recipientIds: selectedTenants,
      scheduledTime: formData.scheduledTime ? new Date(formData.scheduledTime) : undefined,
    });
  };

  const handleSendCampaign = async (campaignId: number) => {
    if (confirm('Are you sure you want to send this campaign?')) {
      await sendMutation.mutateAsync({ id: campaignId });
    }
  };

  const handleDeleteCampaign = async (campaignId: number) => {
    if (confirm('Are you sure you want to delete this campaign?')) {
      await deleteMutation.mutateAsync({ id: campaignId });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
      case 'scheduled':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
      case 'sent':
        return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'cancelled':
        return 'bg-red-500/20 text-red-400 border-red-500/50';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft':
        return <Clock size={16} />;
      case 'scheduled':
        return <Clock size={16} />;
      case 'sent':
        return <CheckCircle size={16} />;
      case 'cancelled':
        return <AlertCircle size={16} />;
      default:
        return <MessageSquare size={16} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
              <MessageSquare size={40} className="text-blue-400" />
              Bulk SMS Campaigns
            </h1>
            <p className="text-gray-400">Send custom announcements to multiple tenants at once</p>
          </div>
          <Button
            onClick={() => setShowCreateForm(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white flex items-center gap-2"
          >
            <Plus size={20} />
            New Campaign
          </Button>
        </div>

        {/* Create Form Modal */}
        {showCreateForm && (
          <Card className="bg-white/5 border-white/10 p-8 mb-8">
            <h2 className="text-2xl font-bold text-white mb-6">Create New Campaign</h2>

            <div className="space-y-6">
              {/* Campaign Name */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Campaign Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Maintenance Notice"
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional description for internal reference"
                  rows={2}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Message Template */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Message *
                </label>
                <textarea
                  value={formData.messageTemplate}
                  onChange={(e) => setFormData({ ...formData, messageTemplate: e.target.value })}
                  placeholder="Enter your SMS message (max 160 characters)"
                  maxLength={160}
                  rows={4}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
                <p className="text-sm text-gray-500 mt-2">
                  {formData.messageTemplate.length}/160 characters
                </p>
              </div>

              {/* Recipients */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Recipients * ({selectedTenants.length} selected)
                </label>
                <Button
                  onClick={() => setShowRecipientSelector(!showRecipientSelector)}
                  className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/20"
                >
                  {showRecipientSelector ? 'Hide Recipient Selector' : 'Select Recipients'}
                </Button>

                {showRecipientSelector && (
                  <div className="mt-4 p-4 bg-white/5 border border-white/10 rounded-lg">
                    <p className="text-gray-400 text-sm mb-4">
                      Select tenants to receive this campaign. You can filter by property or tenant
                      status.
                    </p>
                    {/* In a real app, this would show a multi-select list of tenants */}
                    <div className="space-y-2">
                      <p className="text-gray-500 text-sm italic">
                        Tenant selector would appear here with filtering options
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Scheduling */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Schedule (Optional)
                </label>
                <input
                  type="datetime-local"
                  value={formData.scheduledTime}
                  onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
                <p className="text-sm text-gray-500 mt-2">
                  Leave empty to send immediately, or select a date/time to schedule
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-4 pt-4">
                <Button
                  onClick={handleCreateCampaign}
                  disabled={createMutation.isPending}
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                >
                  {createMutation.isPending ? 'Creating...' : 'Create Campaign'}
                </Button>
                <Button
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 bg-white/10 hover:bg-white/20 text-white border border-white/20"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Search and Filter */}
        <div className="mb-6 flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 text-gray-500" size={20} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search campaigns..."
              className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="scheduled">Scheduled</option>
            <option value="sent">Sent</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Campaign Details Modal */}
        {showDetails && selectedCampaign && analytics && (
          <Card className="bg-white/5 border-white/10 p-8 mb-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white">{selectedCampaign.name}</h2>
                <p className="text-gray-400 mt-2">{selectedCampaign.description}</p>
              </div>
              <Button
                onClick={() => setShowDetails(false)}
                className="bg-white/10 hover:bg-white/20 text-white"
              >
                Close
              </Button>
            </div>

            {/* Analytics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <Card className="bg-white/5 border-white/10 p-4">
                <p className="text-gray-400 text-sm">Total Recipients</p>
                <p className="text-2xl font-bold text-white mt-2">{analytics.totalRecipients}</p>
              </Card>
              <Card className="bg-white/5 border-white/10 p-4">
                <p className="text-gray-400 text-sm">Sent</p>
                <p className="text-2xl font-bold text-blue-400 mt-2">{analytics.sent}</p>
              </Card>
              <Card className="bg-white/5 border-white/10 p-4">
                <p className="text-gray-400 text-sm">Delivered</p>
                <p className="text-2xl font-bold text-green-400 mt-2">{analytics.delivered}</p>
              </Card>
              <Card className="bg-white/5 border-white/10 p-4">
                <p className="text-gray-400 text-sm">Failed</p>
                <p className="text-2xl font-bold text-red-400 mt-2">{analytics.failed}</p>
              </Card>
            </div>

            {/* Message Preview */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-4 mb-8">
              <p className="text-gray-400 text-sm mb-2">Message Preview</p>
              <p className="text-white text-lg">{selectedCampaign.messageTemplate}</p>
            </div>
          </Card>
        )}

        {/* Campaigns List */}
        <div className="space-y-4">
          {filteredCampaigns.length === 0 ? (
            <Card className="bg-white/5 border-white/10 p-8 text-center">
              <MessageSquare size={48} className="mx-auto text-gray-500 mb-4" />
              <p className="text-gray-400">No campaigns found</p>
            </Card>
          ) : (
            filteredCampaigns.map((campaign) => (
              <Card
                key={campaign.id}
                className="bg-white/5 border-white/10 p-6 hover:bg-white/10 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-white">{campaign.name}</h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1 ${getStatusColor(
                          campaign.status
                        )}`}
                      >
                        {getStatusIcon(campaign.status)}
                        {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                      </span>
                    </div>

                    <p className="text-gray-400 text-sm mb-3">{campaign.description}</p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-gray-500 text-xs">Recipients</p>
                        <p className="text-white font-semibold">{campaign.recipientCount}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs">Sent</p>
                        <p className="text-blue-400 font-semibold">{campaign.sentCount}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs">Delivered</p>
                        <p className="text-green-400 font-semibold">{campaign.deliveredCount}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs">Failed</p>
                        <p className="text-red-400 font-semibold">{campaign.failedCount}</p>
                      </div>
                    </div>

                    <p className="text-gray-500 text-xs">
                      Created: {new Date(campaign.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 ml-4">
                    <Button
                      onClick={() => {
                        setSelectedCampaign(campaign);
                        setShowDetails(true);
                      }}
                      className="bg-white/10 hover:bg-white/20 text-white p-2"
                      title="View Details"
                    >
                      <Eye size={18} />
                    </Button>

                    {campaign.status === 'draft' && (
                      <Button
                        onClick={() => handleSendCampaign(campaign.id)}
                        disabled={sendMutation.isPending}
                        className="bg-blue-600 hover:bg-blue-700 text-white p-2"
                        title="Send Campaign"
                      >
                        <Send size={18} />
                      </Button>
                    )}

                    <Button
                      onClick={() => handleDeleteCampaign(campaign.id)}
                      disabled={deleteMutation.isPending}
                      className="bg-red-600 hover:bg-red-700 text-white p-2"
                      title="Delete Campaign"
                    >
                      <Trash2 size={18} />
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
