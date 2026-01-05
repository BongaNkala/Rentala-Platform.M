import React, { useState } from 'react';
import RentalaLayout from '@/components/RentalaLayout';
import { trpc } from '@/lib/trpc';
import { Plus, Edit, Trash2, Eye, CreditCard, TrendingUp, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function Payments() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    leaseId: '',
    unitId: '',
    tenantId: '',
    amount: '',
    dueDate: '',
    paymentMethod: 'bank_transfer' as const,
  });

  // Fetch payments
  const { data: payments, isLoading, refetch } = trpc.payments.list.useQuery();

  // Fetch leases for dropdown
  const { data: leases } = trpc.leases.list.useQuery();

  // Create payment mutation
  const createMutation = trpc.payments.create.useMutation({
    onSuccess: () => {
      refetch();
      setShowCreateModal(false);
      setFormData({
        leaseId: '',
        unitId: '',
        tenantId: '',
        amount: '',
        dueDate: '',
        paymentMethod: 'bank_transfer',
      });
    },
  });

  const handleCreatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const selectedLease = leases?.find((l: any) => l.id === parseInt(formData.leaseId));

    await createMutation.mutateAsync({
      leaseId: parseInt(formData.leaseId),
      unitId: selectedLease?.unitId || 0,
      tenantId: selectedLease?.tenantId || 0,
      amount: parseFloat(formData.amount),
      dueDate: formData.dueDate,
      paymentMethod: formData.paymentMethod,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-500/20 text-green-300';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-300';
      case 'overdue':
        return 'bg-red-500/20 text-red-300';
      case 'partial':
        return 'bg-blue-500/20 text-blue-300';
      default:
        return 'bg-gray-500/20 text-gray-300';
    }
  };

  // Calculate summary stats
  const totalCollected = payments?.reduce((sum: number, p: any) => {
    return sum + (p.status === 'paid' ? parseFloat(p.amount.toString()) : 0);
  }, 0) || 0;

  const totalPending = payments?.reduce((sum: number, p: any) => {
    return sum + (p.status === 'pending' ? parseFloat(p.amount.toString()) : 0);
  }, 0) || 0;

  const totalOverdue = payments?.reduce((sum: number, p: any) => {
    return sum + (p.status === 'overdue' ? parseFloat(p.amount.toString()) : 0);
  }, 0) || 0;

  return (
    <RentalaLayout pageTitle="Payments" pageSubtitle="Track rent collection and payment status">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-gradient-to-br from-green-500/20 to-green-600/10 border border-green-500/30 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-300/80 text-sm font-medium">Collected</p>
              <p className="text-2xl font-bold text-green-300 mt-2">
                R {totalCollected.toLocaleString()}
              </p>
            </div>
            <TrendingUp size={40} className="text-green-500/40" />
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 border border-yellow-500/30 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-300/80 text-sm font-medium">Pending</p>
              <p className="text-2xl font-bold text-yellow-300 mt-2">
                R {totalPending.toLocaleString()}
              </p>
            </div>
            <CreditCard size={40} className="text-yellow-500/40" />
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-red-500/20 to-red-600/10 border border-red-500/30 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-300/80 text-sm font-medium">Overdue</p>
              <p className="text-2xl font-bold text-red-300 mt-2">
                R {totalOverdue.toLocaleString()}
              </p>
            </div>
            <AlertCircle size={40} className="text-red-500/40" />
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
            Record Payment
          </Button>
        </div>
      </div>

      {/* Payments List */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin">
            <div className="w-8 h-8 border-4 border-white/20 border-t-blue-500 rounded-full" />
          </div>
          <p className="text-white/60 mt-4">Loading payments...</p>
        </div>
      ) : payments && payments.length > 0 ? (
        <div className="space-y-4">
          {payments.map((payment: any) => (
            <Card
              key={payment.id}
              className="bg-white/10 border border-white/20 hover:border-white/40 transition-all duration-300 p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <CreditCard size={24} className="text-blue-400" />
                    <div>
                      <h3 className="text-lg font-bold text-white">
                        Payment #{payment.id} - Lease {payment.leaseId}
                      </h3>
                      <p className="text-white/60 text-sm">
                        Due: {new Date(payment.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    <div>
                      <p className="text-white/60 text-sm">Amount</p>
                      <p className="text-green-400 font-bold text-lg">
                        R {parseFloat(payment.amount.toString()).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-white/60 text-sm">Method</p>
                      <p className="text-white font-medium capitalize">
                        {payment.paymentMethod?.replace(/_/g, ' ')}
                      </p>
                    </div>
                    <div>
                      <p className="text-white/60 text-sm">Recorded</p>
                      <p className="text-white font-medium">
                        {payment.recordedDate ? new Date(payment.recordedDate).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-white/60 text-sm">Reference</p>
                      <p className="text-white font-medium text-sm truncate">
                        {payment.reference || 'No reference'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-3">
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(payment.status)}`}>
                    {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                  </span>

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
            <CreditCard size={48} className="mx-auto opacity-50" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No payments recorded</h3>
          <p className="text-white/60 mb-6">Record your first payment to get started</p>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus size={20} className="mr-2" />
            Record Payment
          </Button>
        </Card>
      )}

      {/* Create Payment Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="bg-white/95 border border-white/20 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Record Payment</h2>

              <form onSubmit={handleCreatePayment} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lease
                  </label>
                  <select
                    value={formData.leaseId}
                    onChange={(e) => setFormData({ ...formData, leaseId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select a lease</option>
                    {leases?.map((lease: any) => (
                      <option key={lease.id} value={lease.id}>
                        Lease #{lease.id} - Unit {lease.unitId} (R {parseFloat(lease.rentAmount.toString()).toLocaleString()})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount
                  </label>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 5000"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Method
                  </label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as any })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="cash">Cash</option>
                    <option value="cheque">Cheque</option>
                    <option value="card">Card</option>
                    <option value="eft">EFT</option>
                    <option value="other">Other</option>
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
                    {createMutation.isPending ? 'Recording...' : 'Record'}
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
