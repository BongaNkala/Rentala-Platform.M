import React, { useState, useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import RentalaLayout from '@/components/RentalaLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { DollarSign, TrendingUp, AlertCircle, CheckCircle, Clock, Calendar, User, Building2, Filter, Download, Eye } from 'lucide-react';

interface PaymentRecord {
  id: number;
  leaseId: number;
  tenantId: number;
  unitId?: number;
  propertyId?: number;
  amount: number | string;
  paymentDate?: Date | string | null;
  paidDate?: Date | string | null;
  dueDate: Date | string;
  status: 'paid' | 'pending' | 'overdue' | 'cancelled' | 'partial';
  paymentMethod?: string | null;
  notes?: string | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  currency?: string | null;
  tenantName?: string;
  propertyName?: string;
  unitNumber?: string;
}

export default function PaymentTracking() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<'all' | 'month' | 'quarter' | 'year'>('all');
  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [sortBy, setSortBy] = useState<'dueDate' | 'amount' | 'status'>('dueDate');

  // Fetch payments
  const { data: payments = [], isLoading, refetch } = trpc.payments.list.useQuery();

  // Filter and search payments
  const filteredPayments = useMemo(() => {
    let result = (payments as unknown as PaymentRecord[]) || [];

    // Filter by status
    if (filterStatus) {
      result = result.filter(p => p.status === filterStatus);
    }

    // Search by tenant name, property name, or unit number
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      result = result.filter(p =>
        (p.tenantName?.toLowerCase().includes(search)) ||
        (p.propertyName?.toLowerCase().includes(search)) ||
        (p.unitNumber?.toLowerCase().includes(search))
      );
    }

    // Filter by date range
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfQuarter = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 1);
    const startOfYear = new Date(today.getFullYear(), 0, 1);

    if (dateRange === 'month') {
      result = result.filter(p => {
        const dueDate = new Date(p.dueDate);
        return dueDate >= startOfMonth;
      });
    } else if (dateRange === 'quarter') {
      result = result.filter(p => {
        const dueDate = new Date(p.dueDate);
        return dueDate >= startOfQuarter;
      });
    } else if (dateRange === 'year') {
      result = result.filter(p => {
        const dueDate = new Date(p.dueDate);
        return dueDate >= startOfYear;
      });
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'dueDate') {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      } else if (sortBy === 'amount') {
        return (Number(b.amount) || 0) - (Number(a.amount) || 0);
      } else if (sortBy === 'status') {
        const statusOrder = { overdue: 0, pending: 1, paid: 2, cancelled: 3 };
        return (statusOrder[a.status as keyof typeof statusOrder] || 99) - (statusOrder[b.status as keyof typeof statusOrder] || 99);
      }
      return 0;
    });

    return result;
  }, [payments, searchTerm, filterStatus, dateRange, sortBy]);

  // Calculate payment statistics
  const paymentStats = useMemo(() => {
    const paid = payments.filter(p => p.status === 'paid').length;
    const pending = payments.filter(p => p.status === 'pending').length;
    const overdue = payments.filter(p => p.status === 'overdue').length;
    const cancelled = payments.filter(p => p.status === 'cancelled').length;

    const totalAmount = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const paidAmount = payments
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const overdueAmount = payments
      .filter(p => p.status === 'overdue')
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    const collectionRate = totalAmount > 0 ? ((paidAmount / totalAmount) * 100).toFixed(1) : '0';

    return { paid, pending, overdue, cancelled, totalAmount, paidAmount, overdueAmount, collectionRate };
  }, [payments]);

  const formatDate = (date: Date | string | undefined | null) => {
    if (!date) return 'N/A';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatCurrency = (amount: number | string) => {
    return `R ${Number(amount).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'overdue':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'cancelled':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle size={16} />;
      case 'pending':
        return <Clock size={16} />;
      case 'overdue':
        return <AlertCircle size={16} />;
      default:
        return <Clock size={16} />;
    }
  };

  const isOverdue = (dueDate: Date | string, status: string) => {
    if (status === 'paid' || status === 'cancelled') return false;
    const today = new Date();
    const due = new Date(dueDate);
    return due < today;
  };

  const daysOverdue = (dueDate: Date | string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = today.getTime() - due.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  return (
    <RentalaLayout pageTitle="Payment Tracking" pageSubtitle="Monitor rent payments, arrears, and collection rates">
      {/* Header with Actions */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Payment Tracking</h1>
          <p className="text-gray-400">Track rent payments and manage arrears</p>
        </div>
        <Button className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white">
          <Download size={18} className="mr-2" />
          Export Report
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
        <Card className="bg-gradient-to-br from-blue-600/20 to-blue-400/10 border-blue-500/30 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Total Payments</p>
              <p className="text-2xl font-bold text-white">{payments.length}</p>
            </div>
            <div className="bg-blue-500/20 p-3 rounded-lg">
              <DollarSign size={20} className="text-blue-400" />
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-green-600/20 to-green-400/10 border-green-500/30 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Paid</p>
              <p className="text-2xl font-bold text-white">{paymentStats.paid}</p>
            </div>
            <div className="bg-green-500/20 p-3 rounded-lg">
              <CheckCircle size={20} className="text-green-400" />
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-600/20 to-yellow-400/10 border-yellow-500/30 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Pending</p>
              <p className="text-2xl font-bold text-white">{paymentStats.pending}</p>
            </div>
            <div className="bg-yellow-500/20 p-3 rounded-lg">
              <Clock size={20} className="text-yellow-400" />
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-red-600/20 to-red-400/10 border-red-500/30 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Overdue</p>
              <p className="text-2xl font-bold text-white">{paymentStats.overdue}</p>
            </div>
            <div className="bg-red-500/20 p-3 rounded-lg">
              <AlertCircle size={20} className="text-red-400" />
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-purple-600/20 to-purple-400/10 border-purple-500/30 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Collection Rate</p>
              <p className="text-2xl font-bold text-white">{paymentStats.collectionRate}%</p>
            </div>
            <div className="bg-purple-500/20 p-3 rounded-lg">
              <TrendingUp size={20} className="text-purple-400" />
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-orange-600/20 to-orange-400/10 border-orange-500/30 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Arrears</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(paymentStats.overdueAmount)}</p>
            </div>
            <div className="bg-orange-500/20 p-3 rounded-lg">
              <AlertCircle size={20} className="text-orange-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="bg-white/5 border-white/10 p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-gray-300 text-sm mb-2">Search Payments</label>
            <Input
              placeholder="Search by tenant, property, or unit..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
            />
          </div>

          <div>
            <label className="block text-gray-300 text-sm mb-2">Filter by Status</label>
            <select
              value={filterStatus || ''}
              onChange={(e) => setFilterStatus(e.target.value || null)}
              className="w-full bg-white/10 border border-white/20 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500"
            >
              <option value="">All Statuses</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="overdue">Overdue</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="block text-gray-300 text-sm mb-2">Date Range</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as 'all' | 'month' | 'quarter' | 'year')}
              className="w-full bg-white/10 border border-white/20 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500"
            >
              <option value="all">All Time</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
            </select>
          </div>

          <div>
            <label className="block text-gray-300 text-sm mb-2">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'dueDate' | 'amount' | 'status')}
              className="w-full bg-white/10 border border-white/20 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500"
            >
              <option value="dueDate">Due Date (Urgent First)</option>
              <option value="amount">Amount (High to Low)</option>
              <option value="status">Status</option>
            </select>
          </div>

          <div className="flex items-end">
            <Button
              onClick={() => refetch()}
              variant="outline"
              className="w-full border-white/20 text-white hover:bg-white/10"
            >
              <Filter size={16} className="mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </Card>

      {/* Payments List */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-gray-400">Loading payments...</p>
        </div>
      ) : filteredPayments.length === 0 ? (
        <Card className="bg-white/5 border-white/10 p-12 text-center">
          <DollarSign size={48} className="mx-auto text-gray-600 mb-4" />
          <p className="text-gray-400 text-lg">No payments found</p>
          <p className="text-gray-500 text-sm mt-2">Try adjusting your filters or search terms</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredPayments.map((payment) => (
            <Card
              key={payment.id}
              className="bg-gradient-to-r from-white/5 to-white/[0.02] border-white/10 p-6 hover:border-purple-500/50 transition-all cursor-pointer"
              onClick={() => {
                setSelectedPayment(payment);
                setShowDetailModal(true);
              }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-gradient-to-br from-purple-600/20 to-blue-600/20 p-3 rounded-lg">
                      <DollarSign size={20} className="text-purple-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">{payment.propertyName || 'Property'}</h3>
                      <p className="text-gray-400 text-sm">Unit {payment.unitNumber || payment.id}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
                    <div>
                      <p className="text-gray-400 text-xs mb-1">Tenant</p>
                      <div className="flex items-center gap-2 text-white">
                        <User size={14} className="text-blue-400" />
                        <span className="text-sm">{payment.tenantName || 'Unknown'}</span>
                      </div>
                    </div>

                    <div>
                      <p className="text-gray-400 text-xs mb-1">Amount</p>
                      <p className="text-white font-semibold text-sm">{formatCurrency(payment.amount)}</p>
                    </div>

                    <div>
                      <p className="text-gray-400 text-xs mb-1">Due Date</p>
                      <div className="flex items-center gap-2 text-white">
                        <Calendar size={14} className="text-purple-400" />
                        <span className="text-sm">{formatDate(payment.dueDate)}</span>
                      </div>
                    </div>

                    <div>
                      <p className="text-gray-400 text-sm mb-1">Paid Date</p>
                      <p className="text-white text-sm">{formatDate(payment.paidDate || payment.paymentDate)}</p>
                    </div>

                    <div>
                      <p className="text-gray-400 text-xs mb-1">Method</p>
                      <p className="text-white text-sm capitalize">{payment.paymentMethod || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-3">
                  <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${getStatusColor(payment.status)}`}>
                    {getStatusIcon(payment.status)}
                    <span className="text-xs font-semibold capitalize">{payment.status}</span>
                  </div>

                  {isOverdue(payment.dueDate, payment.status) && (
                    <div className="flex items-center gap-1 text-red-400 text-xs bg-red-500/10 px-2 py-1 rounded">
                      <AlertCircle size={12} />
                      {daysOverdue(payment.dueDate)} days overdue
                    </div>
                  )}

                  <button className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white">
                    <Eye size={16} />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedPayment && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-white/10 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Payment Details</h2>
                  <p className="text-gray-400">{selectedPayment.propertyName} - Unit {selectedPayment.unitNumber}</p>
                </div>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                {/* Payment Information */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Payment Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Tenant Name</p>
                      <p className="text-white font-semibold">{selectedPayment.tenantName}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Status</p>
                      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${getStatusColor(selectedPayment.status)}`}>
                        {getStatusIcon(selectedPayment.status)}
                        <span className="text-xs font-semibold capitalize">{selectedPayment.status}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Amount</p>
                      <p className="text-white font-semibold text-lg">{formatCurrency(selectedPayment.amount)}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Payment Method</p>
                      <p className="text-white font-semibold capitalize">{selectedPayment.paymentMethod || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Dates */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Dates</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Due Date</p>
                      <p className="text-white font-semibold">{formatDate(selectedPayment.dueDate)}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Paid Date</p>
                      <p className="text-white font-semibold">{formatDate(selectedPayment.paymentDate)}</p>
                    </div>
                  </div>
                </div>

                {/* Arrears Information */}
                {isOverdue(selectedPayment.dueDate, selectedPayment.status) && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="text-red-400 mt-1" size={20} />
                      <div>
                        <h4 className="text-white font-semibold mb-1">Arrears Alert</h4>
                        <p className="text-red-300 text-sm">
                          This payment is <span className="font-semibold">{daysOverdue(selectedPayment.dueDate)} days overdue</span>. 
                          Immediate action is recommended to collect this payment.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Notes */}
                {selectedPayment.notes && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">Notes</h3>
                    <p className="text-gray-300 text-sm leading-relaxed">{selectedPayment.notes}</p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-8">
                <Button
                  onClick={() => setShowDetailModal(false)}
                  variant="outline"
                  className="flex-1 border-white/20 text-white hover:bg-white/10"
                >
                  Close
                </Button>
                <Button className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white">
                  Send Reminder
                </Button>
                {selectedPayment.status === 'pending' && (
                  <Button className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white">
                    Mark as Paid
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </div>
      )}
    </RentalaLayout>
  );
}
