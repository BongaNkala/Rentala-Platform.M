import React, { useState, useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import RentalaLayout from '@/components/RentalaLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Calendar, MapPin, User, DollarSign, AlertCircle, CheckCircle, Clock, Plus, Eye, Edit2, Trash2 } from 'lucide-react';

interface LeaseWithDetails {
  id: number;
  unitId: number;
  tenantId: number;
  propertyId: number;
  startDate: Date | string;
  endDate: Date | string;
  rentAmount: number | string;
  deposit?: number | string | null;
  rentEscalation?: number | string | null;
  paymentDueDay: number;
  status: 'active' | 'expired' | 'terminated' | 'pending';
  leaseTerms?: string | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  propertyName?: string;
  tenantName?: string;
  unitNumber?: string;
}

export default function LeaseManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [selectedLease, setSelectedLease] = useState<LeaseWithDetails | null>(null);
  const [showDetailView, setShowDetailView] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [sortBy, setSortBy] = useState<'endDate' | 'rentAmount' | 'status'>('endDate');

  // Fetch leases
  const { data: leases = [], isLoading, refetch } = trpc.leases.list.useQuery();

  // Filter and search leases
  const filteredLeases = useMemo(() => {
    let result = leases as LeaseWithDetails[];

    // Filter by status
    if (filterStatus) {
      result = result.filter(lease => lease.status === filterStatus);
    }

    // Search by tenant name or property name
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      result = result.filter(lease =>
        (lease.tenantName?.toLowerCase().includes(search)) ||
        (lease.propertyName?.toLowerCase().includes(search)) ||
        (lease.unitNumber?.toLowerCase().includes(search))
      );
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'endDate') {
        const dateA = new Date(a.endDate).getTime();
        const dateB = new Date(b.endDate).getTime();
        return dateA - dateB;
      } else if (sortBy === 'rentAmount') {
        const amountA = Number(a.rentAmount) || 0;
        const amountB = Number(b.rentAmount) || 0;
        return amountB - amountA;
      } else if (sortBy === 'status') {
        const statusOrder = { active: 0, pending: 1, expired: 2, terminated: 3 };
        return (statusOrder[a.status as keyof typeof statusOrder] || 99) - (statusOrder[b.status as keyof typeof statusOrder] || 99);
      }
      return 0;
    });

    return result;
  }, [leases, searchTerm, filterStatus, sortBy]);

  // Calculate lease statistics
  const leaseStats = useMemo(() => {
    const active = leases.filter(l => l.status === 'active').length;
    const expired = leases.filter(l => l.status === 'expired').length;
    const pending = leases.filter(l => l.status === 'pending').length;
    const totalRent = leases
      .filter(l => l.status === 'active')
      .reduce((sum, l) => sum + (Number(l.rentAmount) || 0), 0);

    // Leases expiring soon (within 30 days)
    const today = new Date();
    const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    const expiringsoon = leases.filter(l => {
      const endDate = new Date(l.endDate);
      return l.status === 'active' && endDate > today && endDate <= thirtyDaysFromNow;
    }).length;

    return { active, expired, pending, totalRent, expiringsoon };
  }, [leases]);

  const handleSelectLease = (lease: LeaseWithDetails) => {
    setSelectedLease(lease);
    setShowDetailView(true);
  };

  const formatDate = (date: Date | string) => {
    if (!date) return 'N/A';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'expired':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'terminated':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle size={16} />;
      case 'pending':
        return <Clock size={16} />;
      case 'expired':
        return <AlertCircle size={16} />;
      default:
        return <Clock size={16} />;
    }
  };

  const isLeaseExpiringSoon = (endDate: Date | string) => {
    const today = new Date();
    const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    const end = new Date(endDate);
    return end > today && end <= thirtyDaysFromNow;
  };

  return (
    <RentalaLayout pageTitle="Lease Management" pageSubtitle="Manage active and expired leases with renewal tracking">
      {/* Header with Actions */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Lease Management</h1>
          <p className="text-gray-400">Track and manage all property leases</p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
        >
          <Plus size={18} className="mr-2" />
          New Lease
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <Card className="bg-gradient-to-br from-blue-600/20 to-blue-400/10 border-blue-500/30 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Total Leases</p>
              <p className="text-3xl font-bold text-white">{leases.length}</p>
            </div>
            <div className="bg-blue-500/20 p-3 rounded-lg">
              <Calendar size={24} className="text-blue-400" />
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-green-600/20 to-green-400/10 border-green-500/30 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Active Leases</p>
              <p className="text-3xl font-bold text-white">{leaseStats.active}</p>
            </div>
            <div className="bg-green-500/20 p-3 rounded-lg">
              <CheckCircle size={24} className="text-green-400" />
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-600/20 to-yellow-400/10 border-yellow-500/30 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Expiring Soon</p>
              <p className="text-3xl font-bold text-white">{leaseStats.expiringsoon}</p>
            </div>
            <div className="bg-yellow-500/20 p-3 rounded-lg">
              <AlertCircle size={24} className="text-yellow-400" />
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-red-600/20 to-red-400/10 border-red-500/30 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Expired</p>
              <p className="text-3xl font-bold text-white">{leaseStats.expired}</p>
            </div>
            <div className="bg-red-500/20 p-3 rounded-lg">
              <AlertCircle size={24} className="text-red-400" />
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-purple-600/20 to-purple-400/10 border-purple-500/30 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Monthly Rent</p>
              <p className="text-3xl font-bold text-white">R {(leaseStats.totalRent / 1000).toFixed(0)}k</p>
            </div>
            <div className="bg-purple-500/20 p-3 rounded-lg">
              <DollarSign size={24} className="text-purple-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="bg-white/5 border-white/10 p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-gray-300 text-sm mb-2">Search Leases</label>
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
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="expired">Expired</option>
              <option value="terminated">Terminated</option>
            </select>
          </div>

          <div>
            <label className="block text-gray-300 text-sm mb-2">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'endDate' | 'rentAmount' | 'status')}
              className="w-full bg-white/10 border border-white/20 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500"
            >
              <option value="endDate">End Date (Soon First)</option>
              <option value="rentAmount">Rent Amount (High to Low)</option>
              <option value="status">Status</option>
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

      {/* Leases List */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-gray-400">Loading leases...</p>
        </div>
      ) : filteredLeases.length === 0 ? (
        <Card className="bg-white/5 border-white/10 p-12 text-center">
          <Calendar size={48} className="mx-auto text-gray-600 mb-4" />
          <p className="text-gray-400 text-lg">No leases found</p>
          <p className="text-gray-500 text-sm mt-2">Create a new lease to get started</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredLeases.map((lease) => (
            <Card
              key={lease.id}
              className="bg-gradient-to-r from-white/5 to-white/[0.02] border-white/10 p-6 hover:border-purple-500/50 transition-all cursor-pointer"
              onClick={() => handleSelectLease(lease)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-white">{lease.propertyName || 'Property'}</h3>
                      <p className="text-gray-400 text-sm">Unit {lease.unitNumber || lease.unitId}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    <div>
                      <p className="text-gray-400 text-xs mb-1">Tenant</p>
                      <div className="flex items-center gap-2 text-white">
                        <User size={14} className="text-blue-400" />
                        <span className="text-sm">{lease.tenantName || 'Unknown'}</span>
                      </div>
                    </div>

                    <div>
                      <p className="text-gray-400 text-xs mb-1">Monthly Rent</p>
                      <div className="flex items-center gap-2 text-white">
                        <DollarSign size={14} className="text-green-400" />
                        <span className="text-sm font-semibold">R {Number(lease.rentAmount).toLocaleString()}</span>
                      </div>
                    </div>

                    <div>
                      <p className="text-gray-400 text-xs mb-1">Start Date</p>
                      <div className="flex items-center gap-2 text-white">
                        <Calendar size={14} className="text-purple-400" />
                        <span className="text-sm">{formatDate(lease.startDate)}</span>
                      </div>
                    </div>

                    <div>
                      <p className="text-gray-400 text-xs mb-1">End Date</p>
                      <div className="flex items-center gap-2 text-white">
                        <Calendar size={14} className={isLeaseExpiringSoon(lease.endDate) ? 'text-yellow-400' : 'text-purple-400'} />
                        <span className="text-sm">{formatDate(lease.endDate)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-3">
                  <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${getStatusColor(lease.status)}`}>
                    {getStatusIcon(lease.status)}
                    <span className="text-xs font-semibold capitalize">{lease.status}</span>
                  </div>

                  {isLeaseExpiringSoon(lease.endDate) && lease.status === 'active' && (
                    <div className="flex items-center gap-1 text-yellow-400 text-xs bg-yellow-500/10 px-2 py-1 rounded">
                      <AlertCircle size={12} />
                      Expires soon
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white">
                      <Eye size={16} />
                    </button>
                    <button className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white">
                      <Edit2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {showDetailView && selectedLease && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-white/10 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">{selectedLease.propertyName}</h2>
                  <p className="text-gray-400">Unit {selectedLease.unitNumber || selectedLease.unitId}</p>
                </div>
                <button
                  onClick={() => setShowDetailView(false)}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>

              {/* Lease Information */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Lease Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Tenant Name</p>
                      <p className="text-white font-semibold">{selectedLease.tenantName}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Status</p>
                      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${getStatusColor(selectedLease.status)}`}>
                        {getStatusIcon(selectedLease.status)}
                        <span className="text-xs font-semibold capitalize">{selectedLease.status}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Start Date</p>
                      <p className="text-white font-semibold">{formatDate(selectedLease.startDate)}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm mb-1">End Date</p>
                      <p className="text-white font-semibold">{formatDate(selectedLease.endDate)}</p>
                    </div>
                  </div>
                </div>

                {/* Financial Information */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Financial Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Monthly Rent</p>
                      <p className="text-white font-semibold text-lg">R {Number(selectedLease.rentAmount).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Security Deposit</p>
                      <p className="text-white font-semibold">{selectedLease.deposit ? `R ${Number(selectedLease.deposit).toLocaleString()}` : 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Rent Escalation</p>
                      <p className="text-white font-semibold">{selectedLease.rentEscalation ? `${selectedLease.rentEscalation}%` : 'None'}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Payment Due Day</p>
                      <p className="text-white font-semibold">Day {selectedLease.paymentDueDay}</p>
                    </div>
                  </div>
                </div>

                {/* Lease Terms */}
                {selectedLease.leaseTerms && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">Lease Terms</h3>
                    <p className="text-gray-300 text-sm leading-relaxed">{selectedLease.leaseTerms}</p>
                  </div>
                )}

                {/* Renewal Information */}
                <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Calendar className="text-purple-400 mt-1" size={20} />
                    <div>
                      <h4 className="text-white font-semibold mb-1">Renewal Information</h4>
                      <p className="text-gray-300 text-sm">
                        This lease {selectedLease.status === 'active' ? 'expires on' : 'expired on'} <span className="font-semibold">{formatDate(selectedLease.endDate)}</span>
                      </p>
                      {isLeaseExpiringSoon(selectedLease.endDate) && selectedLease.status === 'active' && (
                        <p className="text-yellow-400 text-sm mt-2">⚠️ This lease expires within 30 days. Consider renewing soon.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-8">
                <Button
                  onClick={() => setShowDetailView(false)}
                  variant="outline"
                  className="flex-1 border-white/20 text-white hover:bg-white/10"
                >
                  Close
                </Button>
                <Button className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white">
                  <Edit2 size={16} className="mr-2" />
                  Edit Lease
                </Button>
                <Button className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white">
                  <Plus size={16} className="mr-2" />
                  Renew Lease
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </RentalaLayout>
  );
}
