import React, { useState, useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import RentalaLayout from '@/components/RentalaLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { FileText, Upload, Download, Trash2, Eye, Lock, Calendar, User, Building2, Filter, Plus, Search } from 'lucide-react';

interface Document {
  id: number;
  name: string;
  type: 'lease' | 'payment' | 'inspection' | 'maintenance' | 'other';
  fileUrl?: string;
  fileSize?: number;
  uploadedBy?: string;
  uploadedDate: Date | string;
  expiryDate?: Date | string | null;
  relatedTo?: string; // Property/Tenant/Lease ID
  description?: string;
  isConfidential?: boolean;
  version?: number;
}

export default function DocumentManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [uploadData, setUploadData] = useState({
    name: '',
    type: 'lease',
    description: '',
    expiryDate: '',
    isConfidential: false,
  });

  // Mock documents data (in real app, fetch from API)
  const documents: Document[] = [
    {
      id: 1,
      name: 'Lease Agreement - Unit 4A',
      type: 'lease',
      uploadedBy: 'Admin',
      uploadedDate: new Date('2025-01-15'),
      expiryDate: new Date('2026-01-15'),
      relatedTo: 'Unit 4A',
      description: 'Standard lease agreement for Unit 4A',
      isConfidential: false,
      version: 1,
    },
    {
      id: 2,
      name: 'Payment Receipt - January 2026',
      type: 'payment',
      uploadedBy: 'Tenant',
      uploadedDate: new Date('2026-01-05'),
      relatedTo: 'John Doe',
      description: 'Rent payment receipt for January 2026',
      isConfidential: false,
      version: 1,
    },
    {
      id: 3,
      name: 'Property Inspection Report',
      type: 'inspection',
      uploadedBy: 'Inspector',
      uploadedDate: new Date('2026-02-20'),
      expiryDate: new Date('2027-02-20'),
      relatedTo: 'Sunset Apartments',
      description: 'Annual property inspection report',
      isConfidential: true,
      version: 1,
    },
    {
      id: 4,
      name: 'Maintenance Invoice - Plumbing',
      type: 'maintenance',
      uploadedBy: 'Contractor',
      uploadedDate: new Date('2026-02-10'),
      relatedTo: 'Unit 7B',
      description: 'Invoice for plumbing maintenance work',
      isConfidential: false,
      version: 1,
    },
  ];

  // Filter and search documents
  const filteredDocuments = useMemo(() => {
    let result = documents;

    // Filter by type
    if (filterType) {
      result = result.filter(d => d.type === filterType);
    }

    // Search
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      result = result.filter(d =>
        d.name.toLowerCase().includes(search) ||
        d.description?.toLowerCase().includes(search) ||
        d.relatedTo?.toLowerCase().includes(search)
      );
    }

    return result;
  }, [filterType, searchTerm]);

  // Calculate document statistics
  const docStats = useMemo(() => {
    const total = documents.length;
    const byType = {
      lease: documents.filter(d => d.type === 'lease').length,
      payment: documents.filter(d => d.type === 'payment').length,
      inspection: documents.filter(d => d.type === 'inspection').length,
      maintenance: documents.filter(d => d.type === 'maintenance').length,
      other: documents.filter(d => d.type === 'other').length,
    };

    const expiring = documents.filter(d => {
      if (!d.expiryDate) return false;
      const today = new Date();
      const expiry = new Date(d.expiryDate);
      const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
      return expiry > today && expiry <= thirtyDaysFromNow;
    }).length;

    const confidential = documents.filter(d => d.isConfidential).length;

    return { total, byType, expiring, confidential };
  }, []);

  const formatDate = (date: Date | string | undefined | null) => {
    if (!date) return 'N/A';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'lease':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'payment':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'inspection':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'maintenance':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'lease':
        return <FileText size={16} />;
      case 'payment':
        return <FileText size={16} />;
      case 'inspection':
        return <FileText size={16} />;
      case 'maintenance':
        return <FileText size={16} />;
      default:
        return <FileText size={16} />;
    }
  };

  const isDocumentExpiring = (expiryDate: Date | string | undefined | null) => {
    if (!expiryDate) return false;
    const today = new Date();
    const expiry = new Date(expiryDate);
    const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    return expiry > today && expiry <= thirtyDaysFromNow;
  };

  const handleUploadSubmit = () => {
    console.log('Upload data:', uploadData);
    setShowUploadModal(false);
    setUploadData({
      name: '',
      type: 'lease',
      description: '',
      expiryDate: '',
      isConfidential: false,
    });
  };

  return (
    <RentalaLayout pageTitle="Document Management" pageSubtitle="Store, organize, and manage property documents">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Document Management</h1>
          <p className="text-gray-400">Centralized document storage and management</p>
        </div>
        <Button
          onClick={() => setShowUploadModal(true)}
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
        >
          <Upload size={18} className="mr-2" />
          Upload Document
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <Card className="bg-gradient-to-br from-blue-600/20 to-blue-400/10 border-blue-500/30 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Total Documents</p>
              <p className="text-3xl font-bold text-white">{docStats.total}</p>
            </div>
            <div className="bg-blue-500/20 p-3 rounded-lg">
              <FileText size={24} className="text-blue-400" />
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-purple-600/20 to-purple-400/10 border-purple-500/30 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Leases</p>
              <p className="text-3xl font-bold text-white">{docStats.byType.lease}</p>
            </div>
            <div className="bg-purple-500/20 p-3 rounded-lg">
              <FileText size={24} className="text-purple-400" />
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-green-600/20 to-green-400/10 border-green-500/30 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Payments</p>
              <p className="text-3xl font-bold text-white">{docStats.byType.payment}</p>
            </div>
            <div className="bg-green-500/20 p-3 rounded-lg">
              <FileText size={24} className="text-green-400" />
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-red-600/20 to-red-400/10 border-red-500/30 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Expiring Soon</p>
              <p className="text-3xl font-bold text-white">{docStats.expiring}</p>
            </div>
            <div className="bg-red-500/20 p-3 rounded-lg">
              <Calendar size={24} className="text-red-400" />
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-orange-600/20 to-orange-400/10 border-orange-500/30 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Confidential</p>
              <p className="text-3xl font-bold text-white">{docStats.confidential}</p>
            </div>
            <div className="bg-orange-500/20 p-3 rounded-lg">
              <Lock size={24} className="text-orange-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-white/5 border-white/10 p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-gray-300 text-sm mb-2">Search Documents</label>
            <Input
              placeholder="Search by name, type, or related to..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
            />
          </div>

          <div>
            <label className="block text-gray-300 text-sm mb-2">Filter by Type</label>
            <select
              value={filterType || ''}
              onChange={(e) => setFilterType(e.target.value || null)}
              className="w-full bg-white/10 border border-white/20 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500"
            >
              <option value="">All Types</option>
              <option value="lease">Leases</option>
              <option value="payment">Payments</option>
              <option value="inspection">Inspections</option>
              <option value="maintenance">Maintenance</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="flex items-end">
            <Button
              variant="outline"
              className="w-full border-white/20 text-white hover:bg-white/10"
            >
              <Filter size={16} className="mr-2" />
              Advanced Filters
            </Button>
          </div>
        </div>
      </Card>

      {/* Documents List */}
      {filteredDocuments.length === 0 ? (
        <Card className="bg-white/5 border-white/10 p-12 text-center">
          <FileText size={48} className="mx-auto text-gray-600 mb-4" />
          <p className="text-gray-400 text-lg">No documents found</p>
          <p className="text-gray-500 text-sm mt-2">Try adjusting your filters or upload a new document</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredDocuments.map((doc) => (
            <Card
              key={doc.id}
              className="bg-gradient-to-r from-white/5 to-white/[0.02] border-white/10 p-6 hover:border-purple-500/50 transition-all cursor-pointer"
              onClick={() => {
                setSelectedDocument(doc);
                setShowDetailModal(true);
              }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-gradient-to-br from-purple-600/20 to-blue-600/20 p-3 rounded-lg">
                      <FileText size={20} className="text-purple-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-white">{doc.name}</h3>
                        {doc.isConfidential && (
                          <Lock size={14} className="text-orange-400" />
                        )}
                      </div>
                      <p className="text-gray-400 text-sm">{doc.description}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
                    <div>
                      <p className="text-gray-400 text-xs mb-1">Type</p>
                      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded border text-xs font-semibold ${getTypeColor(doc.type)}`}>
                        {getTypeIcon(doc.type)}
                        <span className="capitalize">{doc.type}</span>
                      </div>
                    </div>

                    <div>
                      <p className="text-gray-400 text-xs mb-1">Uploaded</p>
                      <p className="text-white text-sm">{formatDate(doc.uploadedDate)}</p>
                    </div>

                    <div>
                      <p className="text-gray-400 text-xs mb-1">Uploaded By</p>
                      <p className="text-white text-sm">{doc.uploadedBy}</p>
                    </div>

                    <div>
                      <p className="text-gray-400 text-xs mb-1">Related To</p>
                      <p className="text-white text-sm">{doc.relatedTo || 'N/A'}</p>
                    </div>

                    <div>
                      <p className="text-gray-400 text-xs mb-1">Expiry</p>
                      <p className={`text-sm ${isDocumentExpiring(doc.expiryDate) ? 'text-red-400 font-semibold' : 'text-white'}`}>
                        {formatDate(doc.expiryDate)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  {isDocumentExpiring(doc.expiryDate) && (
                    <div className="text-red-400 text-xs bg-red-500/10 px-2 py-1 rounded">
                      Expiring soon
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white">
                      <Eye size={16} />
                    </button>
                    <button className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white">
                      <Download size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-white/10 w-full max-w-2xl">
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold text-white">Upload Document</h2>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                {/* File Upload Area */}
                <div className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center hover:border-purple-500/50 transition-colors cursor-pointer">
                  <Upload size={32} className="mx-auto text-gray-600 mb-2" />
                  <p className="text-white font-semibold mb-1">Drag and drop your file here</p>
                  <p className="text-gray-400 text-sm">or click to select a file</p>
                </div>

                {/* Form Fields */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-gray-300 text-sm mb-2">Document Name</label>
                    <Input
                      placeholder="Enter document name"
                      value={uploadData.name}
                      onChange={(e) => setUploadData({ ...uploadData, name: e.target.value })}
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-300 text-sm mb-2">Document Type</label>
                      <select
                        value={uploadData.type}
                        onChange={(e) => setUploadData({ ...uploadData, type: e.target.value as any })}
                        className="w-full bg-white/10 border border-white/20 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500"
                      >
                        <option value="lease">Lease</option>
                        <option value="payment">Payment</option>
                        <option value="inspection">Inspection</option>
                        <option value="maintenance">Maintenance</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-gray-300 text-sm mb-2">Expiry Date (Optional)</label>
                      <Input
                        type="date"
                        value={uploadData.expiryDate}
                        onChange={(e) => setUploadData({ ...uploadData, expiryDate: e.target.value })}
                        className="bg-white/10 border-white/20 text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-300 text-sm mb-2">Description</label>
                    <textarea
                      placeholder="Enter document description..."
                      value={uploadData.description}
                      onChange={(e) => setUploadData({ ...uploadData, description: e.target.value })}
                      className="w-full bg-white/10 border border-white/20 text-white placeholder:text-gray-500 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500 min-h-20"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="confidential"
                      checked={uploadData.isConfidential}
                      onChange={(e) => setUploadData({ ...uploadData, isConfidential: e.target.checked })}
                      className="w-4 h-4 rounded border-white/20 bg-white/10 text-purple-600"
                    />
                    <label htmlFor="confidential" className="text-gray-300 text-sm">
                      Mark as confidential
                    </label>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-8">
                <Button
                  onClick={() => setShowUploadModal(false)}
                  variant="outline"
                  className="flex-1 border-white/20 text-white hover:bg-white/10"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUploadSubmit}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                >
                  <Upload size={16} className="mr-2" />
                  Upload Document
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedDocument && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-white/10 w-full max-w-2xl">
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">{selectedDocument.name}</h2>
                  <p className="text-gray-400">Document Details</p>
                </div>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Type</p>
                    <p className="text-white font-semibold capitalize">{selectedDocument.type}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Uploaded By</p>
                    <p className="text-white font-semibold">{selectedDocument.uploadedBy}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Uploaded Date</p>
                    <p className="text-white font-semibold">{formatDate(selectedDocument.uploadedDate)}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Expiry Date</p>
                    <p className="text-white font-semibold">{formatDate(selectedDocument.expiryDate)}</p>
                  </div>
                </div>

                {selectedDocument.description && (
                  <div>
                    <p className="text-gray-400 text-sm mb-2">Description</p>
                    <p className="text-gray-300">{selectedDocument.description}</p>
                  </div>
                )}

                {selectedDocument.isConfidential && (
                  <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4 flex items-start gap-3">
                    <Lock className="text-orange-400 mt-1" size={20} />
                    <div>
                      <h4 className="text-white font-semibold">Confidential Document</h4>
                      <p className="text-orange-300 text-sm mt-1">This document is marked as confidential and has restricted access.</p>
                    </div>
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
                  <Eye size={16} className="mr-2" />
                  Preview
                </Button>
                <Button className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white">
                  <Download size={16} className="mr-2" />
                  Download
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </RentalaLayout>
  );
}
