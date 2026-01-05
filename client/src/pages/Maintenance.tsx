import React, { useState } from 'react';
import RentalaLayout from '@/components/RentalaLayout';
import { trpc } from '@/lib/trpc';
import { Plus, Edit, Trash2, Eye, Wrench, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function Maintenance() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    unitId: '',
    propertyId: '',
    tenantId: '',
    title: '',
    description: '',
    category: 'other' as const,
    priority: 'medium' as const,
  });

  // Fetch maintenance requests
  const { data: maintenance, isLoading, refetch } = trpc.maintenance.list.useQuery();

  // Fetch properties, units and tenants for dropdowns
  const { data: properties } = trpc.properties.list.useQuery();
  const { data: units } = trpc.units.list.useQuery();
  const { data: tenants } = trpc.tenants.list.useQuery();

  // Create maintenance mutation
  const createMutation = trpc.maintenance.create.useMutation({
    onSuccess: () => {
      refetch();
      setShowCreateModal(false);
      setFormData({
        unitId: '',
        propertyId: '',
        tenantId: '',
        title: '',
        description: '',
        category: 'other',
        priority: 'medium',
      });
    },
  });

  const handleCreateMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();

    await createMutation.mutateAsync({
      unitId: parseInt(formData.unitId),
      propertyId: parseInt(formData.propertyId),
      tenantId: formData.tenantId ? parseInt(formData.tenantId) : undefined,
      title: formData.title,
      description: formData.description,
      category: formData.category,
      priority: formData.priority,
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'high':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'low':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const getStatusColor2 = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/20 text-green-300';
      case 'in_progress':
        return 'bg-blue-500/20 text-blue-300';
      case 'assigned':
        return 'bg-purple-500/20 text-purple-300';
      case 'open':
        return 'bg-yellow-500/20 text-yellow-300';
      case 'cancelled':
        return 'bg-gray-500/20 text-gray-300';
      default:
        return 'bg-gray-500/20 text-gray-300';
    }
  };

  // Calculate stats
  const totalRequests = maintenance?.length || 0;
  const openRequests = maintenance?.filter((m: any) => m.status === 'open').length || 0;
  const completedRequests = maintenance?.filter((m: any) => m.status === 'completed').length || 0;

  return (
    <RentalaLayout pageTitle="Maintenance" pageSubtitle="Track and manage maintenance requests">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/30 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-300/80 text-sm font-medium">Total Requests</p>
              <p className="text-2xl font-bold text-blue-300 mt-2">{totalRequests}</p>
            </div>
            <Wrench size={40} className="text-blue-500/40" />
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 border border-yellow-500/30 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-300/80 text-sm font-medium">Open</p>
              <p className="text-2xl font-bold text-yellow-300 mt-2">{openRequests}</p>
            </div>
            <AlertCircle size={40} className="text-yellow-500/40" />
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/20 to-green-600/10 border border-green-500/30 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-300/80 text-sm font-medium">Completed</p>
              <p className="text-2xl font-bold text-green-300 mt-2">{completedRequests}</p>
            </div>
            <CheckCircle size={40} className="text-green-500/40" />
          </div>
        </Card>
      </div>

      {/* Header Actions */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex gap-4">
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
          >
            <Plus size={20} />
            New Request
          </Button>
        </div>
      </div>

      {/* Maintenance List */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin">
            <div className="w-8 h-8 border-4 border-white/20 border-t-blue-500 rounded-full" />
          </div>
          <p className="text-white/60 mt-4">Loading maintenance requests...</p>
        </div>
      ) : maintenance && maintenance.length > 0 ? (
        <div className="space-y-4">
          {maintenance.map((request: any) => (
            <Card
              key={request.id}
              className="bg-white/10 border border-white/20 hover:border-white/40 transition-all duration-300 p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <Wrench size={24} className="text-blue-400" />
                    <div>
                      <h3 className="text-lg font-bold text-white">{request.title}</h3>
                      <p className="text-white/60 text-sm">Unit {request.unitId} • Category: {request.category?.replace(/_/g, ' ')}</p>
                    </div>
                  </div>

                  <p className="text-white/70 text-sm mb-4">{request.description}</p>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-white/60 text-sm">Priority</p>
                      <p className={`text-xs font-semibold px-2 py-1 rounded-full inline-block mt-1 ${getPriorityColor(request.priority)}`}>
                        {request.priority.charAt(0).toUpperCase() + request.priority.slice(1)}
                      </p>
                    </div>
                    <div>
                      <p className="text-white/60 text-sm">Status</p>
                      <p className={`text-xs font-semibold px-2 py-1 rounded-full inline-block mt-1 ${getStatusColor2(request.status)}`}>
                        {request.status?.replace(/_/g, ' ').toUpperCase()}
                      </p>
                    </div>
                    <div>
                      <p className="text-white/60 text-sm">Created</p>
                      <p className="text-white font-medium mt-1">
                        {new Date(request.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-white/60 text-sm">Cost</p>
                      <p className="text-white font-medium mt-1">
                        {request.actualCost ? `R ${parseFloat(request.actualCost.toString()).toLocaleString()}` : 'TBD'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-3">
                  <div className="flex gap-2">
                    <button className="px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg text-sm font-medium transition-colors">
                      <Eye size={16} />
                    </button>
                    <button className="px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-lg text-sm font-medium transition-colors">
                      <Edit size={16} />
                    </button>
                    <button className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg text-sm font-medium transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="bg-white/10 border border-white/20 p-12 text-center">
          <div className="text-white/60 mb-4">
            <Wrench size={48} className="mx-auto opacity-50" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No maintenance requests</h3>
          <p className="text-white/60 mb-6">Create your first maintenance request to get started</p>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus size={20} className="mr-2" />
            New Request
          </Button>
        </Card>
      )}

      {/* Create Maintenance Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="bg-white/95 border border-white/20 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Create Maintenance Request</h2>

              <form onSubmit={handleCreateMaintenance} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Property
                  </label>
                  <select
                    value={formData.propertyId}
                    onChange={(e) => setFormData({ ...formData, propertyId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select a property</option>
                    {properties?.map((prop: any) => (
                      <option key={prop.id} value={prop.id}>
                        {prop.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Unit
                  </label>
                  <select
                    value={formData.unitId}
                    onChange={(e) => setFormData({ ...formData, unitId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select a unit</option>
                    {units?.map((unit: any) => (
                      <option key={unit.id} value={unit.id}>
                        Unit {unit.unitNumber}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tenant (Optional)
                  </label>
                  <select
                    value={formData.tenantId}
                    onChange={(e) => setFormData({ ...formData, tenantId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a tenant</option>
                    {tenants?.map((tenant: any) => (
                      <option key={tenant.id} value={tenant.id}>
                        {tenant.firstName} {tenant.lastName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Leaking roof"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Describe the maintenance issue..."
                    rows={3}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="plumbing">Plumbing</option>
                    <option value="electrical">Electrical</option>
                    <option value="structural">Structural</option>
                    <option value="appliances">Appliances</option>
                    <option value="cleaning">Cleaning</option>
                    <option value="pest_control">Pest Control</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors"
                  >
                    {createMutation.isPending ? 'Creating...' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </Card>
        </div>
      )}
    </RentalaLayout>
  );
}
