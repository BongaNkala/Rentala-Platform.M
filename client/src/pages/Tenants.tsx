import React, { useState } from 'react';
import RentalaLayout from '@/components/RentalaLayout';
import { trpc } from '@/lib/trpc';
import { Plus, Edit, Trash2, Eye, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function Tenants() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    idNumber: '',
    emergencyContact: '',
    emergencyPhone: '',
  });

  // Fetch tenants
  const { data: tenants, isLoading, refetch } = trpc.tenants.list.useQuery();

  // Create tenant mutation
  const createMutation = trpc.tenants.create.useMutation({
    onSuccess: () => {
      refetch();
      setShowCreateModal(false);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        idNumber: '',
        emergencyContact: '',
        emergencyPhone: '',
      });
    },
  });

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();

    await createMutation.mutateAsync({
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      idNumber: formData.idNumber,
      emergencyContact: formData.emergencyContact,
      emergencyPhone: formData.emergencyPhone,
    });
  };

  return (
    <RentalaLayout pageTitle="Tenants" pageSubtitle="Manage your tenant profiles and information">
      {/* Header Actions */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex gap-4">
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
          >
            <Plus size={20} />
            Add Tenant
          </Button>
        </div>
      </div>

      {/* Tenants Grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin">
            <div className="w-8 h-8 border-4 border-white/20 border-t-blue-500 rounded-full" />
          </div>
          <p className="text-white/60 mt-4">Loading tenants...</p>
        </div>
      ) : tenants && tenants.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tenants.map((tenant: any) => (
            <Card
              key={tenant.id}
              className="bg-white/10 border border-white/20 hover:border-white/40 transition-all duration-300 overflow-hidden group"
            >
              <div className="p-6">
                {/* Tenant Header */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white group-hover:text-blue-300 transition-colors">
                      {tenant.firstName} {tenant.lastName}
                    </h3>
                    <p className="text-white/60 text-sm">ID: {tenant.idNumber}</p>
                  </div>
                </div>

                {/* Tenant Details */}
                <div className="space-y-3 mb-6 pb-6 border-b border-white/10">
                  <div className="flex flex-col text-sm">
                    <span className="text-white/60">Email</span>
                    <span className="text-white font-medium truncate">{tenant.email}</span>
                  </div>
                  <div className="flex flex-col text-sm">
                    <span className="text-white/60">Phone</span>
                    <span className="text-white font-medium">{tenant.phone}</span>
                  </div>
                  <div className="flex flex-col text-sm">
                    <span className="text-white/60">Emergency Contact</span>
                    <span className="text-white font-medium">{tenant.emergencyContact}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg text-sm font-medium transition-colors">
                    <Eye size={16} />
                    View
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-lg text-sm font-medium transition-colors">
                    <Edit size={16} />
                    Edit
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg text-sm font-medium transition-colors">
                    <Trash2 size={16} />
                    Delete
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="bg-white/10 border border-white/20 p-12 text-center">
          <div className="text-white/60 mb-4">
            <Users size={48} className="mx-auto opacity-50" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No tenants yet</h3>
          <p className="text-white/60 mb-6">Create your first tenant profile to get started</p>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus size={20} className="mr-2" />
            Create Tenant
          </Button>
        </Card>
      )}

      {/* Create Tenant Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="bg-white/95 border border-white/20 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Add New Tenant</h2>

              <form onSubmit={handleCreateTenant} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ID Number
                  </label>
                  <input
                    type="text"
                    value={formData.idNumber}
                    onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Emergency Contact Name
                  </label>
                  <input
                    type="text"
                    value={formData.emergencyContact}
                    onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Emergency Contact Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.emergencyPhone}
                    onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
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
