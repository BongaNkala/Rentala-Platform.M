import React, { useState, useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import RentalaLayout from '@/components/RentalaLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Wrench, AlertCircle, CheckCircle, Clock, DollarSign, User, Building2, Plus, Edit2, Eye } from 'lucide-react';

interface MaintenanceRequest {
  id: number;
  propertyId: number;
  unitId: number;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  reportedBy?: string;
  assignedTo?: string;
  estimatedCost?: number | string;
  actualCost?: number | string;
  createdDate: Date | string;
  completedDate?: Date | string | null;
  propertyName?: string;
  unitNumber?: string;
  notes?: string;
}

export default function MaintenanceWorkflow() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [filterPriority, setFilterPriority] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<MaintenanceRequest | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);

  // Fetch maintenance requests
  const { data: requests = [], isLoading, refetch } = trpc.maintenance.list.useQuery();

  // Filter and search
  const filteredRequests = useMemo(() => {
    let result = (requests as unknown as MaintenanceRequest[]) || [];

    if (filterStatus) {
      result = result.filter(r => r.status === filterStatus);
    }

    if (filterPriority) {
      result = result.filter(r => r.priority === filterPriority);
    }

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      result = result.filter(r =>
        r.description.toLowerCase().includes(search) ||
        r.propertyName?.toLowerCase().includes(search)
      );
    }

    return result.sort((a, b) => {
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
      return (priorityOrder[a.priority as keyof typeof priorityOrder] || 99) - (priorityOrder[b.priority as keyof typeof priorityOrder] || 99);
    });
  }, [requests, filterStatus, filterPriority, searchTerm]);

  // Calculate stats
  const stats = useMemo(() => {
    const pending = (requests as unknown as MaintenanceRequest[]).filter(r => r.status === 'pending').length;
    const assigned = (requests as unknown as MaintenanceRequest[]).filter(r => r.status === 'assigned').length;
    const inProgress = (requests as unknown as MaintenanceRequest[]).filter(r => r.status === 'in_progress').length;
    const completed = (requests as unknown as MaintenanceRequest[]).filter(r => r.status === 'completed').length;

    const totalCost = (requests as unknown as MaintenanceRequest[])
      .reduce((sum, r) => sum + (Number(r.actualCost) || 0), 0);

    return { pending, assigned, inProgress, completed, totalCost };
  }, [requests]);

  const formatDate = (date: Date | string | undefined | null) => {
    if (!date) return 'N/A';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'high':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'low':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      case 'assigned':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'in_progress':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'completed':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <RentalaLayout pageTitle="Maintenance Workflow" pageSubtitle="Manage maintenance requests and track work orders">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Maintenance Workflow</h1>
          <p className="text-gray-400">Track and manage maintenance requests</p>
        </div>
        <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white">
          <Plus size={18} className="mr-2" />
          New Request
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <Card className="bg-gradient-to-br from-gray-600/20 to-gray-400/10 border-gray-500/30 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Pending</p>
              <p className="text-3xl font-bold text-white">{stats.pending}</p>
            </div>
            <div className="bg-gray-500/20 p-3 rounded-lg">
              <Clock size={24} className="text-gray-400" />
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-blue-600/20 to-blue-400/10 border-blue-500/30 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Assigned</p>
              <p className="text-3xl font-bold text-white">{stats.assigned}</p>
            </div>
            <div className="bg-blue-500/20 p-3 rounded-lg">
              <User size={24} className="text-blue-400" />
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-600/20 to-yellow-400/10 border-yellow-500/30 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">In Progress</p>
              <p className="text-3xl font-bold text-white">{stats.inProgress}</p>
            </div>
            <div className="bg-yellow-500/20 p-3 rounded-lg">
              <Wrench size={24} className="text-yellow-400" />
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-green-600/20 to-green-400/10 border-green-500/30 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Completed</p>
              <p className="text-3xl font-bold text-white">{stats.completed}</p>
            </div>
            <div className="bg-green-500/20 p-3 rounded-lg">
              <CheckCircle size={24} className="text-green-400" />
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-purple-600/20 to-purple-400/10 border-purple-500/30 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Total Cost</p>
              <p className="text-3xl font-bold text-white">R {(stats.totalCost / 1000).toFixed(0)}k</p>
            </div>
            <div className="bg-purple-500/20 p-3 rounded-lg">
              <DollarSign size={24} className="text-purple-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-white/5 border-white/10 p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-gray-300 text-sm mb-2">Search</label>
            <Input
              placeholder="Search by description or property..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
            />
          </div>

          <div>
            <label className="block text-gray-300 text-sm mb-2">Status</label>
            <select
              value={filterStatus || ''}
              onChange={(e) => setFilterStatus(e.target.value || null)}
              className="w-full bg-white/10 border border-white/20 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="assigned">Assigned</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div>
            <label className="block text-gray-300 text-sm mb-2">Priority</label>
            <select
              value={filterPriority || ''}
              onChange={(e) => setFilterPriority(e.target.value || null)}
              className="w-full bg-white/10 border border-white/20 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500"
            >
              <option value="">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div className="flex items-end">
            <Button
              onClick={() => refetch()}
              variant="outline"
              className="w-full border-white/20 text-white hover:bg-white/10"
            >
              Refresh
            </Button>
          </div>
        </div>
      </Card>

      {/* Requests List */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-gray-400">Loading maintenance requests...</p>
        </div>
      ) : filteredRequests.length === 0 ? (
        <Card className="bg-white/5 border-white/10 p-12 text-center">
          <Wrench size={48} className="mx-auto text-gray-600 mb-4" />
          <p className="text-gray-400 text-lg">No maintenance requests found</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((request) => (
            <Card
              key={request.id}
              className="bg-gradient-to-r from-white/5 to-white/[0.02] border-white/10 p-6 hover:border-purple-500/50 transition-all cursor-pointer"
              onClick={() => {
                setSelectedRequest(request);
                setShowDetailModal(true);
              }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-gradient-to-br from-purple-600/20 to-blue-600/20 p-3 rounded-lg">
                      <Wrench size={20} className="text-purple-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">{request.description}</h3>
                      <p className="text-gray-400 text-sm">{request.propertyName} - Unit {request.unitNumber}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
                    <div>
                      <p className="text-gray-400 text-xs mb-1">Priority</p>
                      <div className={`inline-flex items-center px-2 py-1 rounded border text-xs font-semibold ${getPriorityColor(request.priority)}`}>
                        <span className="capitalize">{request.priority}</span>
                      </div>
                    </div>

                    <div>
                      <p className="text-gray-400 text-xs mb-1">Status</p>
                      <div className={`inline-flex items-center px-2 py-1 rounded border text-xs font-semibold ${getStatusColor(request.status)}`}>
                        <span className="capitalize">{request.status.replace('_', ' ')}</span>
                      </div>
                    </div>

                    <div>
                      <p className="text-gray-400 text-xs mb-1">Assigned To</p>
                      <p className="text-white text-sm">{request.assignedTo || 'Unassigned'}</p>
                    </div>

                    <div>
                      <p className="text-gray-400 text-xs mb-1">Est. Cost</p>
                      <p className="text-white text-sm">R {Number(request.estimatedCost || 0).toLocaleString()}</p>
                    </div>

                    <div>
                      <p className="text-gray-400 text-xs mb-1">Reported</p>
                      <p className="text-white text-sm">{formatDate(request.createdDate)}</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white">
                    <Eye size={16} />
                  </button>
                  <button className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white">
                    <Edit2 size={16} />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-white/10 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Maintenance Request</h2>
                  <p className="text-gray-400">{selectedRequest.propertyName}</p>
                </div>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Description</p>
                      <p className="text-white font-semibold">{selectedRequest.description}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Priority</p>
                      <div className={`inline-flex items-center px-3 py-1 rounded border text-sm font-semibold ${getPriorityColor(selectedRequest.priority)}`}>
                        <span className="capitalize">{selectedRequest.priority}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Status</p>
                      <div className={`inline-flex items-center px-3 py-1 rounded border text-sm font-semibold ${getStatusColor(selectedRequest.status)}`}>
                        <span className="capitalize">{selectedRequest.status.replace('_', ' ')}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Assigned To</p>
                      <p className="text-white font-semibold">{selectedRequest.assignedTo || 'Unassigned'}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Cost Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Estimated Cost</p>
                      <p className="text-white font-semibold">R {Number(selectedRequest.estimatedCost || 0).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Actual Cost</p>
                      <p className="text-white font-semibold">{selectedRequest.actualCost ? `R ${Number(selectedRequest.actualCost).toLocaleString()}` : 'Pending'}</p>
                    </div>
                  </div>
                </div>

                {selectedRequest.notes && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">Notes</h3>
                    <p className="text-gray-300">{selectedRequest.notes}</p>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-8">
                <Button
                  onClick={() => setShowDetailModal(false)}
                  variant="outline"
                  className="flex-1 border-white/20 text-white hover:bg-white/10"
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    setShowDetailModal(false);
                    setShowAssignModal(true);
                  }}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white"
                >
                  Assign to Contractor
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </RentalaLayout>
  );
}
