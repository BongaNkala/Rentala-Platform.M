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
  X,
} from 'lucide-react';
import './BulkSMSCampaigns.css';

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
        return 'status-draft';
      case 'scheduled':
        return 'status-scheduled';
      case 'sent':
        return 'status-sent';
      case 'cancelled':
        return 'status-cancelled';
      default:
        return 'status-draft';
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
    <div className="sms-campaigns-container">
      {/* Header */}
      <div className="campaigns-header">
        <div className="header-content">
          <h1 className="page-title">
            <MessageSquare className="title-icon" />
            Bulk SMS Campaigns
          </h1>
          <p className="page-subtitle">Send custom announcements to multiple tenants at once</p>
        </div>
        <Button
          onClick={() => setShowCreateForm(true)}
          className="btn-create-campaign"
        >
          <Plus size={20} />
          New Campaign
        </Button>
      </div>

      {/* Create Form Modal */}
      {showCreateForm && (
        <div className="modal-overlay" onClick={() => setShowCreateForm(false)}>
          <div className="glass-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New Campaign</h2>
              <button
                className="modal-close"
                onClick={() => setShowCreateForm(false)}
              >
                <X size={24} />
              </button>
            </div>

            <div className="modal-body">
              {/* Campaign Name */}
              <div className="form-group">
                <label className="form-label">Campaign Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Maintenance Notice"
                  className="form-input"
                />
              </div>

              {/* Description */}
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional description for internal reference"
                  rows={2}
                  className="form-textarea"
                />
              </div>

              {/* Message Template */}
              <div className="form-group">
                <label className="form-label">Message *</label>
                <textarea
                  value={formData.messageTemplate}
                  onChange={(e) => setFormData({ ...formData, messageTemplate: e.target.value })}
                  placeholder="Enter your SMS message (max 160 characters)"
                  maxLength={160}
                  rows={4}
                  className="form-textarea"
                />
                <p className="char-count">
                  {formData.messageTemplate.length}/160 characters
                </p>
              </div>

              {/* Recipients */}
              <div className="form-group">
                <label className="form-label">
                  Recipients * ({selectedTenants.length} selected)
                </label>
                <button
                  onClick={() => setShowRecipientSelector(!showRecipientSelector)}
                  className="btn-secondary"
                >
                  {showRecipientSelector ? 'Hide Recipient Selector' : 'Select Recipients'}
                </button>

                {showRecipientSelector && (
                  <div className="recipient-selector">
                    <p className="selector-hint">
                      Select tenants to receive this campaign. You can filter by property or tenant
                      status.
                    </p>
                  </div>
                )}
              </div>

              {/* Scheduling */}
              <div className="form-group">
                <label className="form-label">Schedule (Optional)</label>
                <input
                  type="datetime-local"
                  value={formData.scheduledTime}
                  onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                  className="form-input"
                />
                <p className="form-hint">
                  Leave empty to send immediately, or select a date/time to schedule
                </p>
              </div>

              {/* Actions */}
              <div className="modal-actions">
                <button
                  onClick={handleCreateCampaign}
                  disabled={createMutation.isPending}
                  className="btn-primary"
                >
                  {createMutation.isPending ? 'Creating...' : 'Create Campaign'}
                </button>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filter */}
      <div className="campaigns-filters">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search campaigns..."
            className="search-input"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="filter-select"
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
        <div className="modal-overlay" onClick={() => setShowDetails(false)}>
          <div className="glass-modal modal-details" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>{selectedCampaign.name}</h2>
                <p className="modal-subtitle">{selectedCampaign.description}</p>
              </div>
              <button
                className="modal-close"
                onClick={() => setShowDetails(false)}
              >
                <X size={24} />
              </button>
            </div>

            {/* Analytics Grid */}
            <div className="analytics-grid">
              <div className="analytics-card">
                <p className="analytics-label">Total Recipients</p>
                <p className="analytics-value">{analytics.totalRecipients}</p>
              </div>
              <div className="analytics-card">
                <p className="analytics-label">Sent</p>
                <p className="analytics-value sent">{analytics.sent}</p>
              </div>
              <div className="analytics-card">
                <p className="analytics-label">Delivered</p>
                <p className="analytics-value delivered">{analytics.delivered}</p>
              </div>
              <div className="analytics-card">
                <p className="analytics-label">Failed</p>
                <p className="analytics-value failed">{analytics.failed}</p>
              </div>
            </div>

            {/* Message Preview */}
            <div className="message-preview">
              <p className="preview-label">Message Preview</p>
              <p className="preview-text">{selectedCampaign.messageTemplate}</p>
            </div>
          </div>
        </div>
      )}

      {/* Campaigns List */}
      <div className="campaigns-list">
        {filteredCampaigns.length === 0 ? (
          <div className="empty-state">
            <MessageSquare size={48} />
            <p>No campaigns found</p>
          </div>
        ) : (
          filteredCampaigns.map((campaign) => (
            <div key={campaign.id} className="campaign-card glass-panel">
              <div className="campaign-header">
                <div className="campaign-title-section">
                  <h3 className="campaign-name">{campaign.name}</h3>
                  <span className={`status-badge ${getStatusColor(campaign.status)}`}>
                    {getStatusIcon(campaign.status)}
                    <span>{campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}</span>
                  </span>
                </div>

                <div className="campaign-actions">
                  <button
                    onClick={() => {
                      setSelectedCampaign(campaign);
                      setShowDetails(true);
                    }}
                    className="action-btn action-view"
                    title="View Details"
                  >
                    <Eye size={18} />
                  </button>

                  {campaign.status === 'draft' && (
                    <button
                      onClick={() => handleSendCampaign(campaign.id)}
                      disabled={sendMutation.isPending}
                      className="action-btn action-send"
                      title="Send Campaign"
                    >
                      <Send size={18} />
                    </button>
                  )}

                  <button
                    onClick={() => handleDeleteCampaign(campaign.id)}
                    disabled={deleteMutation.isPending}
                    className="action-btn action-delete"
                    title="Delete Campaign"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              {campaign.description && (
                <p className="campaign-description">{campaign.description}</p>
              )}

              <div className="campaign-stats">
                <div className="stat-item">
                  <span className="stat-label">Recipients</span>
                  <span className="stat-value">{campaign.recipientCount || 0}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Sent</span>
                  <span className="stat-value sent">{campaign.sentCount || 0}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Delivered</span>
                  <span className="stat-value delivered">{campaign.deliveredCount || 0}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Failed</span>
                  <span className="stat-value failed">{campaign.failedCount || 0}</span>
                </div>
              </div>

              <p className="campaign-date">
                Created: {new Date(campaign.createdAt).toLocaleDateString()}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
