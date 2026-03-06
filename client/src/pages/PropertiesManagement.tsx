import { useState, useMemo } from 'react';
import RentalaLayout from '@/components/RentalaLayout';
import { trpc } from '@/lib/trpc';
import { Plus, Edit, Trash2, Eye, Search, Filter, MapPin, Home, Users, DollarSign, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface PropertyWithStats {
  id: number;
  name: string;
  address: string;
  city: string;
  province?: string | null;
  propertyType: string;
  status: string;
  totalUnits: number;
  occupiedUnits?: number | null;
  monthlyRevenue?: number | null;
  description?: string | null;
  ownerId?: number;
  postalCode?: string | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export default function PropertiesManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<PropertyWithStats | null>(null);
  const [showDetailView, setShowDetailView] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    province: '',
    propertyType: 'residential' as const,
    totalUnits: 1,
    description: '',
  });

  // Fetch properties
  const { data: properties = [], isLoading, refetch } = trpc.properties.list.useQuery();

  // Filter and search properties
  const filteredProperties = useMemo(() => {
    return properties.filter((prop: PropertyWithStats) => {
      const matchesSearch = prop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           prop.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           prop.city.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = !filterType || prop.propertyType === filterType;
      return matchesSearch && matchesFilter;
    });
  }, [properties, searchTerm, filterType]);

  // Create property mutation
  const createMutation = trpc.properties.create.useMutation({
    onSuccess: () => {
      refetch();
      setShowCreateModal(false);
      setFormData({ name: '', address: '', city: '', province: '', propertyType: 'residential', totalUnits: 1, description: '' });
    },
  });

  const handleCreateProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    await createMutation.mutateAsync(formData);
  };

  const handleSelectProperty = (property: PropertyWithStats) => {
    setSelectedProperty(property);
    setShowDetailView(true);
  };

  const propertyTypes = ['residential', 'commercial', 'mixed'];
  const occupancyRate = (occupied: number, total: number) => total > 0 ? Math.round((occupied / total) * 100) : 0;

  return (
    <RentalaLayout pageTitle="Properties Management" pageSubtitle="Manage and monitor all your rental properties">
      {/* Header with Actions */}
      <div className="mb-8 space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white flex items-center gap-2 shadow-lg"
            >
              <Plus size={20} />
              Add New Property
            </Button>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="flex gap-4 flex-wrap">
          <div className="flex-1 min-w-64 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <Input
              type="text"
              placeholder="Search properties by name, address, or city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400"
            />
          </div>
          <div className="flex gap-2">
            <Filter size={20} className="text-gray-400 self-center" />
            {propertyTypes.map((type) => (
              <Button
                key={type}
                onClick={() => setFilterType(filterType === type ? null : type)}
                variant={filterType === type ? 'default' : 'outline'}
                className={`capitalize ${
                  filterType === type
                    ? 'bg-purple-600 text-white'
                    : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                }`}
              >
                {type}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Properties Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="inline-block animate-spin mb-4">
              <div className="w-8 h-8 border-4 border-white/20 border-t-blue-500 rounded-full" />
            </div>
            <p className="text-white/60">Loading properties...</p>
          </div>
        </div>
      ) : filteredProperties.length === 0 ? (
        <Card className="bg-white/10 border-white/20 p-12 text-center">
          <Home size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-white/60 mb-4">No properties found</p>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Create your first property
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProperties.map((property: PropertyWithStats) => (
            <Card
              key={property.id}
              className="bg-gradient-to-br from-white/10 to-white/5 border-white/20 hover:border-white/40 transition-all cursor-pointer group"
              onClick={() => handleSelectProperty(property)}
            >
              <div className="p-6">
                {/* Property Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-1">{property.name}</h3>
                    <div className="flex items-center gap-2 text-gray-300 text-sm">
                      <MapPin size={16} />
                      <span>{property.city}, {property.province || 'SA'}</span>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    property.propertyType === 'residential' ? 'bg-blue-500/30 text-blue-200' :
                    property.propertyType === 'commercial' ? 'bg-orange-500/30 text-orange-200' :
                    'bg-purple-500/30 text-purple-200'
                  }`}>
                    {property.propertyType}
                  </span>
                </div>

                {/* Property Address */}
                <p className="text-gray-300 text-sm mb-4 line-clamp-2">{property.address}</p>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                      <Home size={14} />
                      <span>Units</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{property.totalUnits}</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                      <Users size={14} />
                      <span>Occupied</span>
                    </div>
                    <p className="text-2xl font-bold text-green-400">{property.occupiedUnits || 0}</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3 col-span-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-gray-400 text-xs">Occupancy Rate</span>
                      <span className="text-xs font-semibold text-green-400">
                        {occupancyRate(property.occupiedUnits || 0, property.totalUnits)}%
                      </span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-green-500 to-green-400 h-2 rounded-full transition-all"
                        style={{ width: `${occupancyRate(property.occupiedUnits || 0, property.totalUnits)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Monthly Revenue */}
                {property.monthlyRevenue && (
                  <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-lg p-3 mb-4">
                    <div className="flex items-center gap-2 text-gray-300 text-sm mb-1">
                      <DollarSign size={16} />
                      <span>Monthly Revenue</span>
                    </div>
                    <p className="text-2xl font-bold text-white">R {property.monthlyRevenue.toLocaleString()}</p>
                  </div>
                )}

                {/* Description */}
                {property.description && (
                  <p className="text-gray-400 text-sm mb-4 line-clamp-2">{property.description}</p>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4 border-t border-white/10">
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectProperty(property);
                    }}
                    variant="outline"
                    className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20 flex items-center justify-center gap-2"
                  >
                    <Eye size={16} />
                    View Details
                  </Button>
                  <Button
                    onClick={(e) => e.stopPropagation()}
                    variant="outline"
                    className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20 flex items-center justify-center gap-2"
                  >
                    <Edit size={16} />
                    Edit
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Property Detail Modal */}
      {showDetailView && selectedProperty && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-white/20 max-w-2xl w-full max-h-96 overflow-y-auto">
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2">{selectedProperty.name}</h2>
                  <div className="flex items-center gap-2 text-gray-300">
                    <MapPin size={18} />
                    <span>{selectedProperty.address}</span>
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
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <p className="text-gray-400 text-sm mb-1">Property Type</p>
                  <p className="text-white font-semibold capitalize">{selectedProperty.propertyType}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">Status</p>
                  <p className="text-white font-semibold capitalize">{selectedProperty.status}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">Total Units</p>
                  <p className="text-white font-semibold">{selectedProperty.totalUnits}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">Occupied Units</p>
                  <p className="text-green-400 font-semibold">{selectedProperty.occupiedUnits || 0}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">City</p>
                  <p className="text-white font-semibold">{selectedProperty.city}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">Province</p>
                  <p className="text-white font-semibold">{selectedProperty.province || 'N/A'}</p>
                </div>
              </div>

              {selectedProperty.description && (
                <div className="mb-6">
                  <p className="text-gray-400 text-sm mb-2">Description</p>
                  <p className="text-white">{selectedProperty.description}</p>
                </div>
              )}

              <div className="flex gap-3 pt-6 border-t border-white/10">
                <Button
                  onClick={() => setShowDetailView(false)}
                  className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  Close
                </Button>
                <Button
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Edit Property
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Create Property Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-white/20 max-w-2xl w-full">
            <div className="p-8">
              <h2 className="text-2xl font-bold text-white mb-6">Add New Property</h2>
              <form onSubmit={handleCreateProperty} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-300 text-sm mb-2">Property Name *</label>
                    <Input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Sunset Apartments"
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 text-sm mb-2">Property Type *</label>
                    <select
                      value={formData.propertyType}
                      onChange={(e) => setFormData({ ...formData, propertyType: e.target.value as any })}
                      className="w-full bg-white/10 border border-white/20 text-white rounded-md p-2"
                    >
                      <option value="residential">Residential</option>
                      <option value="commercial">Commercial</option>
                      <option value="mixed">Mixed</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-gray-300 text-sm mb-2">Address *</label>
                  <Input
                    type="text"
                    required
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Street address"
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-300 text-sm mb-2">City *</label>
                    <Input
                      type="text"
                      required
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="City"
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 text-sm mb-2">Province</label>
                    <Input
                      type="text"
                      value={formData.province}
                      onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                      placeholder="Province"
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-300 text-sm mb-2">Total Units *</label>
                  <Input
                    type="number"
                    required
                    min="1"
                    value={formData.totalUnits}
                    onChange={(e) => setFormData({ ...formData, totalUnits: parseInt(e.target.value) })}
                    placeholder="Number of units"
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 text-sm mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Property description"
                    rows={3}
                    className="w-full bg-white/10 border border-white/20 text-white rounded-md p-2 placeholder:text-gray-500"
                  />
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
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {createMutation.isPending ? 'Creating...' : 'Create Property'}
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
