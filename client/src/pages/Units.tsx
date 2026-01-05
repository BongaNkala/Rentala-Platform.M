import React, { useState } from 'react';
import RentalaLayout from '@/components/RentalaLayout';
import { trpc } from '@/lib/trpc';
import { Plus, Edit, Trash2, Eye, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function Units() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    unitNumber: '',
    unitType: 'one_bedroom' as const,
    bedrooms: 1,
    bathrooms: 1,
    rentAmount: '',
  });

  // Fetch units
  const { data: units, isLoading, refetch } = trpc.units.list.useQuery();

  // Fetch properties for dropdown
  const { data: properties } = trpc.properties.list.useQuery();

  // Create unit mutation
  const createMutation = trpc.units.create.useMutation({
    onSuccess: () => {
      refetch();
      setShowCreateModal(false);
      setFormData({ unitNumber: '', unitType: 'one_bedroom', bedrooms: 1, bathrooms: 1, rentAmount: '' });
    },
  });

  const handleCreateUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProperty) {
      alert('Please select a property');
      return;
    }

    await createMutation.mutateAsync({
      propertyId: selectedProperty,
      unitNumber: formData.unitNumber,
      unitType: formData.unitType,
      bedrooms: formData.bedrooms,
      bathrooms: formData.bathrooms,
      rentAmount: parseFloat(formData.rentAmount),
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'occupied':
        return 'bg-green-500/20 text-green-300';
      case 'vacant':
        return 'bg-yellow-500/20 text-yellow-300';
      case 'maintenance':
        return 'bg-red-500/20 text-red-300';
      default:
        return 'bg-gray-500/20 text-gray-300';
    }
  };

  return (
    <RentalaLayout pageTitle="Units" pageSubtitle="Manage your rental units">
      {/* Header Actions */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex gap-4">
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
          >
            <Plus size={20} />
            Add Unit
          </Button>
        </div>
      </div>

      {/* Units Grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin">
            <div className="w-8 h-8 border-4 border-white/20 border-t-blue-500 rounded-full" />
          </div>
          <p className="text-white/60 mt-4">Loading units...</p>
        </div>
      ) : units && units.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {units.map((unit: any) => (
            <Card
              key={unit.id}
              className="bg-white/10 border border-white/20 hover:border-white/40 transition-all duration-300 overflow-hidden group"
            >
              <div className="p-6">
                {/* Unit Header */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white group-hover:text-blue-300 transition-colors">
                      Unit {unit.unitNumber}
                    </h3>
                    <p className="text-white/60 text-sm">{unit.unitType?.replace(/_/g, ' ')}</p>
                  </div>
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(unit.status)}`}>
                    {unit.status.charAt(0).toUpperCase() + unit.status.slice(1)}
                  </span>
                </div>

                {/* Unit Details */}
                <div className="space-y-3 mb-6 pb-6 border-b border-white/10">
                  <div className="flex justify-between text-sm">
                    <span className="text-white/60">Bedrooms</span>
                    <span className="text-white font-medium">{unit.bedrooms}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/60">Bathrooms</span>
                    <span className="text-white font-medium">{unit.bathrooms}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/60">Rent Amount</span>
                    <span className="text-green-400 font-medium">R {parseFloat(unit.rentAmount.toString()).toLocaleString()}</span>
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
            <Home size={48} className="mx-auto opacity-50" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No units yet</h3>
          <p className="text-white/60 mb-6">Create your first unit to get started</p>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus size={20} className="mr-2" />
            Create Unit
          </Button>
        </Card>
      )}

      {/* Create Unit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="bg-white/95 border border-white/20 max-w-md w-full">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Add New Unit</h2>

              <form onSubmit={handleCreateUnit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Property
                  </label>
                  <select
                    value={selectedProperty || ''}
                    onChange={(e) => setSelectedProperty(parseInt(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select a property</option>
                    {properties?.map((prop) => (
                      <option key={prop.id} value={prop.id}>
                        {prop.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Unit Number
                  </label>
                  <input
                    type="text"
                    value={formData.unitNumber}
                    onChange={(e) => setFormData({ ...formData, unitNumber: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 4A, 201, etc."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Unit Type
                  </label>
                  <select
                    value={formData.unitType}
                    onChange={(e) => setFormData({ ...formData, unitType: e.target.value as any })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="studio">Studio</option>
                    <option value="one_bedroom">1 Bedroom</option>
                    <option value="two_bedroom">2 Bedrooms</option>
                    <option value="three_bedroom">3 Bedrooms</option>
                    <option value="four_bedroom">4 Bedrooms</option>
                    <option value="five_plus_bedroom">5+ Bedrooms</option>
                    <option value="commercial">Commercial</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bedrooms
                    </label>
                    <input
                      type="number"
                      value={formData.bedrooms}
                      onChange={(e) => setFormData({ ...formData, bedrooms: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bathrooms
                    </label>
                    <input
                      type="number"
                      value={formData.bathrooms}
                      onChange={(e) => setFormData({ ...formData, bathrooms: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Monthly Rent Amount
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
