import React, { useState, useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import RentalaLayout from '@/components/RentalaLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Calendar, CheckCircle, AlertCircle, Plus, Edit2, Send, FileText, Clock, DollarSign, TrendingUp } from 'lucide-react';

interface LeaseForRenewal {
  id: number;
  tenantId: number;
  propertyId: number;
  unitId: number;
  startDate: Date | string;
  endDate: Date | string;
  rentAmount: number | string;
  rentEscalation?: number | string | null;
  status: 'active' | 'expired' | 'pending' | 'terminated';
  tenantName?: string;
  propertyName?: string;
  unitNumber?: string;
}

export default function LeaseRenewal() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | null>('expiring');
  const [selectedLease, setSelectedLease] = useState<LeaseForRenewal | null>(null);
  const [showRenewalForm, setShowRenewalForm] = useState(false);
  const [renewalData, setRenewalData] = useState({
    newRentAmount: '',
    rentEscalation: '5',
    newStartDate: '',
    newEndDate: '',
    leaseTerms: '',
  });

  // Fetch leases
  const { data: leases = [], isLoading, refetch } = trpc.leases.list.useQuery();

  // Filter leases for renewal
  const renewalCandidates = useMemo(() => {
    const today = new Date();
    const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    const ninetyDaysFromNow = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000);

    let result = (leases as unknown as LeaseForRenewal[]) || [];

    // Filter by renewal status
    if (filterStatus === 'expiring') {
      result = result.filter(l => {
        const endDate = new Date(l.endDate);
        return l.status === 'active' && endDate > today && endDate <= thirtyDaysFromNow;
      });
    } else if (filterStatus === 'upcoming') {
      result = result.filter(l => {
        const endDate = new Date(l.endDate);
        return l.status === 'active' && endDate > thirtyDaysFromNow && endDate <= ninetyDaysFromNow;
      });
    } else if (filterStatus === 'expired') {
      result = result.filter(l => {
        const endDate = new Date(l.endDate);
        return endDate <= today;
      });
    }

    // Search
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      result = result.filter(l =>
        (l.tenantName?.toLowerCase().includes(search)) ||
        (l.propertyName?.toLowerCase().includes(search))
      );
    }

    return result;
  }, [leases, filterStatus, searchTerm]);

  // Calculate renewal statistics
  const renewalStats = useMemo(() => {
    const today = new Date();
    const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    const ninetyDaysFromNow = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000);

    const expiring = (leases as unknown as LeaseForRenewal[]).filter(l => {
      const endDate = new Date(l.endDate);
      return l.status === 'active' && endDate > today && endDate <= thirtyDaysFromNow;
    }).length;

    const upcoming = (leases as unknown as LeaseForRenewal[]).filter(l => {
      const endDate = new Date(l.endDate);
      return l.status === 'active' && endDate > thirtyDaysFromNow && endDate <= ninetyDaysFromNow;
    }).length;

    const expired = (leases as unknown as LeaseForRenewal[]).filter(l => {
      const endDate = new Date(l.endDate);
      return endDate <= today;
    }).length;

    return { expiring, upcoming, expired };
  }, [leases]);

  const formatDate = (date: Date | string) => {
    if (!date) return 'N/A';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const daysUntilExpiry = (endDate: Date | string) => {
    const today = new Date();
    const end = new Date(endDate);
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleRenewalSubmit = () => {
    // Handle renewal submission
    console.log('Renewal data:', renewalData);
    setShowRenewalForm(false);
    setRenewalData({
      newRentAmount: '',
      rentEscalation: '5',
      newStartDate: '',
      newEndDate: '',
      leaseTerms: '',
    });
  };

  return (
    <RentalaLayout pageTitle="Lease Renewal" pageSubtitle="Manage lease renewals and track expiring leases">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Lease Renewal Management</h1>
          <p className="text-gray-400">Track and manage upcoming lease renewals</p>
        </div>
        <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white">
          <Plus size={18} className="mr-2" />
          New Renewal
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="bg-gradient-to-br from-red-600/20 to-red-400/10 border-red-500/30 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Expiring (0-30 days)</p>
              <p className="text-3xl font-bold text-white">{renewalStats.expiring}</p>
            </div>
            <div className="bg-red-500/20 p-3 rounded-lg">
              <AlertCircle size={24} className="text-red-400" />
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-600/20 to-yellow-400/10 border-yellow-500/30 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Upcoming (30-90 days)</p>
              <p className="text-3xl font-bold text-white">{renewalStats.upcoming}</p>
            </div>
            <div className="bg-yellow-500/20 p-3 rounded-lg">
              <Clock size={24} className="text-yellow-400" />
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-blue-600/20 to-blue-400/10 border-blue-500/30 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Expired</p>
              <p className="text-3xl font-bold text-white">{renewalStats.expired}</p>
            </div>
            <div className="bg-blue-500/20 p-3 rounded-lg">
              <Calendar size={24} className="text-blue-400" />
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-green-600/20 to-green-400/10 border-green-500/30 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Total Leases</p>
              <p className="text-3xl font-bold text-white">{leases.length}</p>
            </div>
            <div className="bg-green-500/20 p-3 rounded-lg">
              <FileText size={24} className="text-green-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-white/5 border-white/10 p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-gray-300 text-sm mb-2">Search Leases</label>
            <Input
              placeholder="Search by tenant or property..."
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
              <option value="expiring">Expiring Soon (0-30 days)</option>
              <option value="upcoming">Upcoming (30-90 days)</option>
              <option value="expired">Expired</option>
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
      ) : renewalCandidates.length === 0 ? (
        <Card className="bg-white/5 border-white/10 p-12 text-center">
          <Calendar size={48} className="mx-auto text-gray-600 mb-4" />
          <p className="text-gray-400 text-lg">No leases found</p>
          <p className="text-gray-500 text-sm mt-2">Try adjusting your filters</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {renewalCandidates.map((lease) => {
            const daysLeft = daysUntilExpiry(lease.endDate);
            const isUrgent = daysLeft <= 30;

            return (
              <Card
                key={lease.id}
                className={`bg-gradient-to-r from-white/5 to-white/[0.02] border-white/10 p-6 hover:border-purple-500/50 transition-all cursor-pointer ${
                  isUrgent ? 'border-red-500/50' : ''
                }`}
                onClick={() => {
                  setSelectedLease(lease);
                  setShowRenewalForm(true);
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`p-3 rounded-lg ${isUrgent ? 'bg-red-500/20' : 'bg-purple-500/20'}`}>
                        <FileText size={20} className={isUrgent ? 'text-red-400' : 'text-purple-400'} />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">{lease.propertyName}</h3>
                        <p className="text-gray-400 text-sm">Unit {lease.unitNumber}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
                      <div>
                        <p className="text-gray-400 text-xs mb-1">Tenant</p>
                        <p className="text-white font-semibold text-sm">{lease.tenantName}</p>
                      </div>

                      <div>
                        <p className="text-gray-400 text-xs mb-1">Current Rent</p>
                        <p className="text-white font-semibold text-sm">R {Number(lease.rentAmount).toLocaleString()}</p>
                      </div>

                      <div>
                        <p className="text-gray-400 text-xs mb-1">Lease Ends</p>
                        <p className="text-white font-semibold text-sm">{formatDate(lease.endDate)}</p>
                      </div>

                      <div>
                        <p className="text-gray-400 text-xs mb-1">Days Left</p>
                        <p className={`font-semibold text-sm ${isUrgent ? 'text-red-400' : 'text-yellow-400'}`}>
                          {daysLeft} days
                        </p>
                      </div>

                      <div>
                        <p className="text-gray-400 text-xs mb-1">Escalation</p>
                        <p className="text-white font-semibold text-sm">{lease.rentEscalation || '0'}%</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    {isUrgent && (
                      <div className="flex items-center gap-1 text-red-400 text-xs bg-red-500/10 px-2 py-1 rounded">
                        <AlertCircle size={12} />
                        Urgent
                      </div>
                    )}
                    <button className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white">
                      <Edit2 size={16} />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Renewal Form Modal */}
      {showRenewalForm && selectedLease && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-white/10 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Renew Lease</h2>
                  <p className="text-gray-400">{selectedLease.propertyName} - {selectedLease.tenantName}</p>
                </div>
                <button
                  onClick={() => setShowRenewalForm(false)}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                {/* Current Lease Info */}
                <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-3">Current Lease Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Current Rent</p>
                      <p className="text-white font-semibold">R {Number(selectedLease.rentAmount).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Current Escalation</p>
                      <p className="text-white font-semibold">{selectedLease.rentEscalation || '0'}%</p>
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

                {/* Renewal Form */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Renewal Details</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-gray-300 text-sm mb-2">New Rent Amount</label>
                        <Input
                          type="number"
                          placeholder="Enter new rent amount"
                          value={renewalData.newRentAmount}
                          onChange={(e) => setRenewalData({ ...renewalData, newRentAmount: e.target.value })}
                          className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
                        />
                      </div>

                      <div>
                        <label className="block text-gray-300 text-sm mb-2">Annual Escalation %</label>
                        <Input
                          type="number"
                          placeholder="Enter escalation percentage"
                          value={renewalData.rentEscalation}
                          onChange={(e) => setRenewalData({ ...renewalData, rentEscalation: e.target.value })}
                          className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-gray-300 text-sm mb-2">New Start Date</label>
                        <Input
                          type="date"
                          value={renewalData.newStartDate}
                          onChange={(e) => setRenewalData({ ...renewalData, newStartDate: e.target.value })}
                          className="bg-white/10 border-white/20 text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-gray-300 text-sm mb-2">New End Date</label>
                        <Input
                          type="date"
                          value={renewalData.newEndDate}
                          onChange={(e) => setRenewalData({ ...renewalData, newEndDate: e.target.value })}
                          className="bg-white/10 border-white/20 text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-gray-300 text-sm mb-2">Lease Terms</label>
                      <textarea
                        placeholder="Enter any additional lease terms..."
                        value={renewalData.leaseTerms}
                        onChange={(e) => setRenewalData({ ...renewalData, leaseTerms: e.target.value })}
                        className="w-full bg-white/10 border border-white/20 text-white placeholder:text-gray-500 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500 min-h-24"
                      />
                    </div>
                  </div>
                </div>

                {/* Renewal Summary */}
                <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
                  <h4 className="text-white font-semibold mb-2">Renewal Summary</h4>
                  <div className="space-y-2 text-sm text-gray-300">
                    <p>✓ New lease agreement will be generated</p>
                    <p>✓ Tenant notification email will be sent</p>
                    <p>✓ Lease will be updated in the system</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-8">
                <Button
                  onClick={() => setShowRenewalForm(false)}
                  variant="outline"
                  className="flex-1 border-white/20 text-white hover:bg-white/10"
                >
                  Cancel
                </Button>
                <Button className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white">
                  <FileText size={16} className="mr-2" />
                  Generate Document
                </Button>
                <Button
                  onClick={handleRenewalSubmit}
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                >
                  <Send size={16} className="mr-2" />
                  Submit Renewal
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </RentalaLayout>
  );
}
