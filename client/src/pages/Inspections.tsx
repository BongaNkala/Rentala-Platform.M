import React, { useState } from 'react';
import RentalaLayout from '@/components/RentalaLayout';
import { trpc } from '@/lib/trpc';
import { Plus, Edit, Trash2, Eye, ClipboardCheck, AlertCircle, CheckCircle, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function Inspections() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    unitId: '',
    propertyId: '',
    inspectionType: 'periodic' as const,
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  // Fetch inspections
  const { data: inspections, isLoading, refetch } = trpc.inspections.list.useQuery();

  // Fetch properties and units for dropdowns
  const { data: properties } = trpc.properties.list.useQuery();
  const { data: units } = trpc.units.list.useQuery();

  // Create inspection mutation
  const createMutation = trpc.inspections.create.useMutation({
    onSuccess: () => {
      refetch();
      setShowCreateModal(false);
      setFormData({
        unitId: '',
        propertyId: '',
        inspectionType: 'periodic',
        date: new Date().toISOString().split('T')[0],
        notes: '',
      });
    },
  });

  const handleCreateInspection = async (e: React.FormEvent) => {
    e.preventDefault();

    await createMutation.mutateAsync({
      unitId: parseInt(formData.unitId),
      propertyId: parseInt(formData.propertyId),
      inspectionType: formData.inspectionType,
      date: formData.date,
      notes: formData.notes || undefined,
    });
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'move_in':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'move_out':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'periodic':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'maintenance':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/20 text-green-300';
      case 'in_progress':
        return 'bg-blue-500/20 text-blue-300';
      case 'scheduled':
        return 'bg-yellow-500/20 text-yellow-300';
      case 'pending':
        return 'bg-orange-500/20 text-orange-300';
      default:
        return 'bg-gray-500/20 text-gray-300';
    }
  };

  // Calculate stats
  const totalInspections = inspections?.length || 0;
  const completedInspections = inspections?.filter((i: any) => i.status === 'completed').length || 0;
  const pendingInspections = inspections?.filter((i: any) => i.status === 'pending' || i.status === 'scheduled').length || 0;

  return (
    <RentalaLayout pageTitle="Inspections" pageSubtitle="Track property inspections and damage reports">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/30 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-300/80 text-sm font-medium">Total Inspections</p>
              <p className="text-2xl font-bold text-blue-300 mt-2">{totalInspections}</p>
            </div>
            <ClipboardCheck size={40} className="text-blue-500/40" />
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/20 to-green-600/10 border border-green-500/30 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-300/80 text-sm font-medium">Completed</p>
              <p className="text-2xl font-bold text-green-300 mt-2">{completedInspections}</p>
            </div>
            <CheckCircle size={40} className="text-green-500/40" />
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 border border-yellow-500/30 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-300/80 text-sm font-medium">Pending</p>
              <p className="text-2xl font-bold text-yellow-300 mt-2">{pendingInspections}</p>
            </div>
            <AlertCircle size={40} className="text-yellow-500/40" />
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
            Schedule Inspection
          </Button>
        </div>
      </div>

      {/* Inspections List */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin">
            <div className="w-8 h-8 border-4 border-white/20 border-t-blue-500 rounded-full" />
          </div>
          <p className="text-white/60 mt-4">Loading inspections...</p>
        </div>
      ) : inspections && inspections.length > 0 ? (
        <div className="space-y-4">
          {inspections.map((inspection: any) => (
            <Card
              key={inspection.id}
              className="bg-white/10 border border-white/20 hover:border-white/40 transition-all duration-300 p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <ClipboardCheck size={24} className="text-blue-400" />
                    <div>
                      <h3 className="text-lg font-bold text-white">
                        {inspection.inspectionType === 'move_in' ? 'Move-In' : inspection.inspectionType === 'move_out' ? 'Move-Out' : inspection.inspectionType === 'periodic' ? 'Routine' : 'Maintenance'} Inspection
                      </h3>
                      <p className="text-white/60 text-sm">Unit {inspection.unitId} • ID: {inspection.id}</p>
                    </div>
                  </div>

                  {inspection.notes && (
                    <p className="text-white/70 text-sm mb-4">{inspection.notes}</p>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-white/60 text-sm">Type</p>
                      <p className={`text-xs font-semibold px-2 py-1 rounded-full inline-block mt-1 ${getTypeColor(inspection.inspectionType)}`}>
                        {inspection.inspectionType?.replace(/_/g, ' ').toUpperCase()}
                      </p>
                    </div>
                    <div>
                      <p className="text-white/60 text-sm">Status</p>
                      <p className={`text-xs font-semibold px-2 py-1 rounded-full inline-block mt-1 ${getStatusColor(inspection.status)}`}>
                        {inspection.status?.replace(/_/g, ' ').toUpperCase()}
                      </p>
                    </div>
                    <div>
                      <p className="text-white/60 text-sm">Date</p>
                      <p className="text-white font-medium mt-1">
                        {new Date(inspection.date).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-white/60 text-sm">Findings</p>
                      <p className="text-white font-medium mt-1">
                        {inspection.findings || 'None'}
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
                      <Camera size={16} />
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
            <ClipboardCheck size={48} className="mx-auto opacity-50" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No inspections scheduled</h3>
          <p className="text-white/60 mb-6">Schedule your first inspection to get started</p>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus size={20} className="mr-2" />
            Schedule Inspection
          </Button>
        </Card>
      )}

      {/* Create Inspection Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="bg-white/95 border border-white/20 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Schedule Inspection</h2>

              <form onSubmit={handleCreateInspection} className="space-y-4">
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
                    Inspection Type
                  </label>
                  <select
                    value={formData.inspectionType}
                    onChange={(e) => setFormData({ ...formData, inspectionType: e.target.value as any })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="move_in">Move-In</option>
                    <option value="move_out">Move-Out</option>
                    <option value="periodic">Routine</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Inspection Date
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Add any notes or special instructions..."
                    rows={4}
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
                    {createMutation.isPending ? 'Scheduling...' : 'Schedule'}
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
