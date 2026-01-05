import React, { useState } from 'react';
import RentalaLayout from '@/components/RentalaLayout';
import { trpc } from '@/lib/trpc';
import { Plus, Edit, Trash2, Eye, FileText, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function Leases() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    unitId: '',
    tenantId: '',
    propertyId: '',
    startDate: '',
    endDate: '',
    rentAmount: '',
    deposit: '',
  });

  // Fetch leases
  const { data: leases, isLoading, refetch } = trpc.leases.list.useQuery();

  // Fetch units, tenants, and properties for dropdowns
  const { data: units } = trpc.units.list.useQuery();
  const { data: tenants } = trpc.tenants.list.useQuery();
  const { data: properties } = trpc.properties.list.useQuery();

  // Create lease mutation
  const createMutation = trpc.leases.create.useMutation({
    onSuccess: () => {
      refetch();
      setShowCreateModal(false);
      setFormData({
        unitId: '',
        tenantId: '',
        propertyId: '',
        startDate: '',
        endDate: '',
        rentAmount: '',
        deposit: '',
      });
    },
  });

  const handleCreateLease = async (e: React.FormEvent) => {
    e.preventDefault();

    await createMutation.mutateAsync({
      unitId: parseInt(formData.unitId),
      tenantId: parseInt(formData.tenantId),
      propertyId: parseInt(formData.propertyId),
      startDate: formData.startDate,
      endDate: formData.endDate,
      rentAmount: parseFloat(formData.rentAmount),
      deposit: parseFloat(formData.deposit),
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/20 text-green-300';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-300';
      case 'expired':
        return 'bg-red-500/20 text-red-300';
      case 'terminated':
        return 'bg-gray-500/20 text-gray-300';
      default:
        return 'bg-blue-500/20 text-blue-300';
    }
  };

  const isExpiringSoon = (endDate: string) => {
    const end = new Date(endDate);
    const today = new Date();
    const daysUntilExpiry = Math.floor((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  };

  return (
    <RentalaLayout pageTitle="Leases" pageSubtitle="Manage rental agreements and lease terms">
      {/* Header Actions */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex gap-4">
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
          >
            <Plus size={20} />
            Create Lease
          </Button>
        </div>
      </div>

      {/* Leases List */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin">
            <div className="w-8 h-8 border-4 border-white/20 border-t-blue-500 rounded-full" />
          </div>
          <p className="text-white/60 mt-4">Loading leases...</p>
        </div>
      ) : leases && leases.length > 0 ? (
        <div className="space-y-4">
          {leases.map((lease: any) => (
            <Card
              key={lease.id}
              className="bg-white/10 border border-white/20 hover:border-white/40 transition-all duration-300 p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <FileText size={24} className="text-blue-400" />
                    <div>
                      <h3 className="text-lg font-bold text-white">
                        Unit {lease.unitId} - Lease #{lease.id}
                      </h3>
                      <p className="text-white/60 text-sm">Tenant ID: {lease.tenantId}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    <div>
                      <p className="text-white/60 text-sm">Start Date</p>
                      <p className="text-white font-medium">
                        {new Date(lease.startDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-white/60 text-sm">End Date</p>
                      <p className="text-white font-medium">
                        {new Date(lease.endDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-white/60 text-sm">Monthly Rent</p>
                      <p className="text-green-400 font-medium">
                        R {parseFloat(lease.rentAmount.toString()).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-white/60 text-sm">Deposit</p>
                      <p className="text-white font-medium">
                        R {parseFloat(lease.deposit.toString()).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-3">
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(lease.status)}`}>
                    {lease.status.charAt(0).toUpperCase() + lease.status.slice(1)}
                  </span>

                  {isExpiringSoon(lease.endDate) && (
                    <div className="flex items-center gap-1 text-yellow-300 text-xs">
                      <AlertCircle size={16} />
                      <span>Expiring soon</span>
                    </div>
                  )}

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
            <FileText size={48} className="mx-auto opacity-50" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No leases yet</h3>
          <p className="text-white/60 mb-6">Create your first lease agreement to get started</p>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus size={20} className="mr-2" />
            Create Lease
          </Button>
        </Card>
      )}

      {/* Create Lease Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="bg-white/95 border border-white/20 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Lease</h2>

              <form onSubmit={handleCreateLease} className="space-y-4">
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
                        Unit {unit.unitNumber} (R {parseFloat(unit.rentAmount.toString()).toLocaleString()})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tenant
                  </label>
                  <select
                    value={formData.tenantId}
                    onChange={(e) => setFormData({ ...formData, tenantId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select a tenant</option>
                    {tenants?.map((tenant: any) => (
                      <option key={tenant.id} value={tenant.id}>
                        {tenant.firstName} {tenant.lastName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Monthly Rent
                    </label>
                    <input
                      type="number"
                      value={formData.rentAmount}
                      onChange={(e) => setFormData({ ...formData, rentAmount: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., 5000"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Deposit
                    </label>
                    <input
                      type="number"
                      value={formData.deposit}
                      onChange={(e) => setFormData({ ...formData, deposit: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., 5000"
                      required
                    />
                  </div>
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
