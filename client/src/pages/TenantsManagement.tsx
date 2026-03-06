import { useState, useMemo } from 'react';
import RentalaLayout from '@/components/RentalaLayout';
import { trpc } from '@/lib/trpc';
import { Plus, Edit, Trash2, Eye, Search, Filter, Mail, Phone, MapPin, Calendar, FileText, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface TenantWithDetails {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  idNumber: string;
  idType: string;
  dateOfBirth?: Date | string | null;
  nationality?: string | null;
  employmentStatus?: string | null;
  employer?: string | null;
  monthlyIncome?: number | string | null;
  status: string;
  createdAt?: Date | string;
  profileImage?: string | null;
  userId?: number | null;
  emergencyContact?: string | null;
  emergencyPhone?: string | null;
  documents?: string | null;
  updatedAt?: Date | string;
}

export default function TenantsManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [selectedTenant, setSelectedTenant] = useState<TenantWithDetails | null>(null);
  const [showDetailView, setShowDetailView] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    idNumber: '',
    idType: 'national_id' as const,
    dateOfBirth: '',
    nationality: '',
    employmentStatus: 'employed' as const,
    employer: '',
    monthlyIncome: 0,
  });

  // Fetch tenants
  const { data: tenants = [], isLoading, refetch } = trpc.tenants.list.useQuery();

  // Filter and search tenants
  const filteredTenants = useMemo(() => {
    return tenants.filter((tenant: TenantWithDetails) => {
      const fullName = `${tenant.firstName} ${tenant.lastName}`.toLowerCase();
      const matchesSearch = fullName.includes(searchTerm.toLowerCase()) ||
                           tenant.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           tenant.phone.includes(searchTerm);
      const matchesFilter = !filterStatus || tenant.status === filterStatus;
      return matchesSearch && matchesFilter;
    });
  }, [tenants, searchTerm, filterStatus]);

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
        idType: 'national_id',
        dateOfBirth: '',
        nationality: '',
        employmentStatus: 'employed',
        employer: '',
        monthlyIncome: 0,
      });
    },
  });

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    await createMutation.mutateAsync({
      ...formData,
      monthlyIncome: formData.monthlyIncome ? Number(formData.monthlyIncome) : undefined,
    });
  };

  const handleSelectTenant = (tenant: TenantWithDetails) => {
    setSelectedTenant(tenant);
    setShowDetailView(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/30 text-green-200';
      case 'inactive':
        return 'bg-gray-500/30 text-gray-200';
      case 'blacklisted':
        return 'bg-red-500/30 text-red-200';
      default:
        return 'bg-blue-500/30 text-blue-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle size={16} />;
      case 'inactive':
        return <Clock size={16} />;
      case 'blacklisted':
        return <AlertCircle size={16} />;
      default:
        return null;
    }
  };

  const statuses = ['active', 'inactive', 'blacklisted'];
  const employmentStatuses = ['employed', 'self_employed', 'unemployed', 'student', 'retired'];
  const idTypes = ['national_id', 'passport', 'drivers_license'];

  return (
    <RentalaLayout pageTitle="Tenants Management" pageSubtitle="Manage tenant profiles and rental history">
      {/* Header with Actions */}
      <div className="mb-8 space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white flex items-center gap-2 shadow-lg"
            >
              <Plus size={20} />
              Add New Tenant
            </Button>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="flex gap-4 flex-wrap">
          <div className="flex-1 min-w-64 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <Input
              type="text"
              placeholder="Search tenants by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400"
            />
          </div>
          <div className="flex gap-2">
            <Filter size={20} className="text-gray-400 self-center" />
            {statuses.map((status) => (
              <Button
                key={status}
                onClick={() => setFilterStatus(filterStatus === status ? null : status)}
                variant={filterStatus === status ? 'default' : 'outline'}
                className={`capitalize ${
                  filterStatus === status
                    ? 'bg-purple-600 text-white'
                    : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                }`}
              >
                {status}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Tenants List */}
      {isLoading ? (
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="inline-block animate-spin mb-4">
              <div className="w-8 h-8 border-4 border-white/20 border-t-blue-500 rounded-full" />
            </div>
            <p className="text-white/60">Loading tenants...</p>
          </div>
        </div>
      ) : filteredTenants.length === 0 ? (
        <Card className="bg-white/10 border-white/20 p-12 text-center">
          <FileText size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-white/60 mb-4">No tenants found</p>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            Add your first tenant
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredTenants.map((tenant: TenantWithDetails) => (
            <Card
              key={tenant.id}
              className="bg-gradient-to-br from-white/10 to-white/5 border-white/20 hover:border-white/40 transition-all cursor-pointer group"
              onClick={() => handleSelectTenant(tenant)}
            >
              <div className="p-6">
                <div className="flex justify-between items-start gap-4">
                  {/* Tenant Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                        {tenant.firstName[0]}{tenant.lastName[0]}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">{tenant.firstName} {tenant.lastName}</h3>
                        <div className="flex items-center gap-2 text-gray-300 text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${getStatusColor(tenant.status)}`}>
                            {getStatusIcon(tenant.status)}
                            {tenant.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Contact Info */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="flex items-center gap-2 text-gray-300">
                        <Mail size={16} className="text-blue-400" />
                        <span className="text-sm">{tenant.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-300">
                        <Phone size={16} className="text-green-400" />
                        <span className="text-sm">{tenant.phone}</span>
                      </div>
                    <div className="flex items-center gap-2 text-gray-300">
                      <FileText size={16} className="text-purple-400" />
                      <span className="text-sm">{tenant.idNumber}</span>
                    </div>
                  </div>

                  {/* Employment Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-400 text-xs mb-1">Employment Status</p>
                      <p className="text-white font-semibold capitalize">{tenant.employmentStatus?.replace('_', ' ') || 'N/A'}</p>
                    </div>
                      {tenant.employer && (
                        <div>
                          <p className="text-gray-400 text-xs mb-1">Employer</p>
                          <p className="text-white font-semibold">{tenant.employer}</p>
                        </div>
                      )}
                      {tenant.monthlyIncome && (
                        <div>
                          <p className="text-gray-400 text-xs mb-1">Monthly Income</p>
                          <p className="text-green-400 font-semibold">R {tenant.monthlyIncome.toLocaleString()}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectTenant(tenant);
                      }}
                      variant="outline"
                      className="bg-white/10 border-white/20 text-white hover:bg-white/20 flex items-center gap-2"
                    >
                      <Eye size={16} />
                      View
                    </Button>
                    <Button
                      onClick={(e) => e.stopPropagation()}
                      variant="outline"
                      className="bg-white/10 border-white/20 text-white hover:bg-white/20 flex items-center gap-2"
                    >
                      <Edit size={16} />
                      Edit
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Tenant Detail Modal */}
      {showDetailView && selectedTenant && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-white/20 max-w-2xl w-full max-h-96 overflow-y-auto">
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-2xl">
                    {selectedTenant.firstName[0]}{selectedTenant.lastName[0]}
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-white">{selectedTenant.firstName} {selectedTenant.lastName}</h2>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mt-2 flex items-center gap-1 ${getStatusColor(selectedTenant.status)}`}>
                      {getStatusIcon(selectedTenant.status)}
                      {selectedTenant.status}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setShowDetailView(false)}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>

              {/* Detail Grid */}
              <div className="space-y-6">
                {/* Contact Information */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Contact Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Email</p>
                      <p className="text-white">{selectedTenant.email}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Phone</p>
                      <p className="text-white">{selectedTenant.phone}</p>
                    </div>
                  </div>
                </div>

                {/* Identity Information */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Identity Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-400 text-sm mb-1">ID Type</p>
                      <p className="text-white capitalize">{selectedTenant.idType.replace('_', ' ')}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm mb-1">ID Number</p>
                      <p className="text-white">{selectedTenant.idNumber}</p>
                    </div>
                    {selectedTenant.dateOfBirth && (
                      <div>
                        <p className="text-gray-400 text-sm mb-1">Date of Birth</p>
                        <p className="text-white">{typeof selectedTenant.dateOfBirth === 'string' ? new Date(selectedTenant.dateOfBirth).toLocaleDateString() : selectedTenant.dateOfBirth?.toLocaleDateString?.() || 'N/A'}</p>
                      </div>
                    )}
                    {selectedTenant.nationality && (
                      <div>
                        <p className="text-gray-400 text-sm mb-1">Nationality</p>
                        <p className="text-white">{selectedTenant.nationality}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Employment Information */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Employment Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Employment Status</p>
                      <p className="text-white capitalize">{selectedTenant.employmentStatus?.replace('_', ' ') || 'N/A'}</p>
                    </div>
                    {selectedTenant.employer && (
                      <div>
                        <p className="text-gray-400 text-sm mb-1">Employer</p>
                        <p className="text-white">{selectedTenant.employer}</p>
                      </div>
                    )}
                    {selectedTenant.monthlyIncome && (
                      <div>
                        <p className="text-gray-400 text-sm mb-1">Monthly Income</p>
                        <p className="text-green-400 font-semibold">R {selectedTenant.monthlyIncome.toLocaleString()}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-6 border-t border-white/10 mt-6">
                <Button
                  onClick={() => setShowDetailView(false)}
                  className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  Close
                </Button>
                <Button
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Edit Tenant
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Create Tenant Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-white/20 max-w-2xl w-full max-h-96 overflow-y-auto">
            <div className="p-8">
              <h2 className="text-2xl font-bold text-white mb-6">Add New Tenant</h2>
              <form onSubmit={handleCreateTenant} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-300 text-sm mb-2">First Name *</label>
                    <Input
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      placeholder="First name"
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 text-sm mb-2">Last Name *</label>
                    <Input
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      placeholder="Last name"
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-300 text-sm mb-2">Email *</label>
                    <Input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="Email address"
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 text-sm mb-2">Phone *</label>
                    <Input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="Phone number"
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-300 text-sm mb-2">ID Type *</label>
                    <select
                      value={formData.idType}
                      onChange={(e) => setFormData({ ...formData, idType: e.target.value as any })}
                      className="w-full bg-white/10 border border-white/20 text-white rounded-md p-2"
                    >
                      {idTypes.map((type) => (
                        <option key={type} value={type}>
                          {type.replace('_', ' ')}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-300 text-sm mb-2">ID Number *</label>
                    <Input
                      type="text"
                      required
                      value={formData.idNumber}
                      onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
                      placeholder="ID number"
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-300 text-sm mb-2">Employment Status *</label>
                    <select
                      value={formData.employmentStatus}
                      onChange={(e) => setFormData({ ...formData, employmentStatus: e.target.value as any })}
                      className="w-full bg-white/10 border border-white/20 text-white rounded-md p-2"
                    >
                      {employmentStatuses.map((status) => (
                        <option key={status} value={status}>
                          {status.replace('_', ' ')}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-300 text-sm mb-2">Employer</label>
                    <Input
                      type="text"
                      value={formData.employer}
                      onChange={(e) => setFormData({ ...formData, employer: e.target.value })}
                      placeholder="Employer name"
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-300 text-sm mb-2">Monthly Income</label>
                    <Input
                      type="number"
                      value={formData.monthlyIncome || ''}
                      onChange={(e) => setFormData({ ...formData, monthlyIncome: e.target.value ? parseFloat(e.target.value) : 0 })}
                      placeholder="Monthly income"
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 text-sm mb-2">Nationality</label>
                    <Input
                      type="text"
                      value={formData.nationality}
                      onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                      placeholder="Nationality"
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-6 border-t border-white/10">
                  <Button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  >
                    {createMutation.isPending ? 'Creating...' : 'Create Tenant'}
                  </Button>
                </div>
              </form>
            </div>
          </Card>
        </div>
      )}
    </RentalaLayout>
  );
}
