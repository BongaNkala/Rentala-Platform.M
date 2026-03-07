import React, { useState, useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import RentalaLayout from '@/components/RentalaLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { BarChart3, TrendingUp, DollarSign, Users, Building2, Calendar, Download, Filter, Eye } from 'lucide-react';

interface AnalyticsData {
  period: 'month' | 'quarter' | 'year';
  totalRevenue: number;
  averageOccupancy: number;
  totalProperties: number;
  activeLeases: number;
  maintenanceCost: number;
  collectionRate: number;
  averageRent: number;
  tenantRetention: number;
}

interface PropertyMetrics {
  propertyId: number;
  propertyName: string;
  occupancyRate: number;
  monthlyRevenue: number;
  maintenanceCost: number;
  tenantCount: number;
  averageRent: number;
}

export default function AnalyticsReporting() {
  const [period, setPeriod] = useState<'month' | 'quarter' | 'year'>('month');
  const [selectedProperty, setSelectedProperty] = useState<string | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Mock analytics data
  const analyticsData: AnalyticsData = {
    period,
    totalRevenue: 125400,
    averageOccupancy: 94,
    totalProperties: 3,
    activeLeases: 8,
    maintenanceCost: 8500,
    collectionRate: 96,
    averageRent: 6750,
    tenantRetention: 92,
  };

  // Mock property metrics
  const propertyMetrics: PropertyMetrics[] = [
    {
      propertyId: 1,
      propertyName: 'Sunset Apartments',
      occupancyRate: 95,
      monthlyRevenue: 45000,
      maintenanceCost: 3200,
      tenantCount: 15,
      averageRent: 7200,
    },
    {
      propertyId: 2,
      propertyName: 'Downtown Complex',
      occupancyRate: 92,
      monthlyRevenue: 38500,
      maintenanceCost: 2800,
      tenantCount: 12,
      averageRent: 6400,
    },
    {
      propertyId: 3,
      propertyName: 'Garden Heights',
      occupancyRate: 96,
      monthlyRevenue: 41900,
      maintenanceCost: 2500,
      tenantCount: 13,
      averageRent: 6800,
    },
  ];

  // Calculate trends
  const trends = useMemo(() => {
    return {
      revenueGrowth: 12.5,
      occupancyGrowth: 2.3,
      maintenanceGrowth: -5.2,
      collectionGrowth: 1.8,
    };
  }, []);

  const formatCurrency = (value: number) => {
    return `R ${value.toLocaleString('en-ZA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  return (
    <RentalaLayout pageTitle="Analytics & Reporting" pageSubtitle="Performance metrics and financial insights">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Analytics & Reporting</h1>
          <p className="text-gray-400">Comprehensive performance metrics and insights</p>
        </div>
        <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white">
          <Download size={18} className="mr-2" />
          Export Report
        </Button>
      </div>

      {/* Period Selector */}
      <div className="flex gap-3 mb-8">
        {(['month', 'quarter', 'year'] as const).map((p) => (
          <Button
            key={p}
            onClick={() => setPeriod(p)}
            className={`${
              period === p
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                : 'bg-white/10 border border-white/20 text-gray-300 hover:bg-white/20'
            }`}
          >
            <Calendar size={16} className="mr-2" />
            {p.charAt(0).toUpperCase() + p.slice(1)}
          </Button>
        ))}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="bg-gradient-to-br from-blue-600/20 to-blue-400/10 border-blue-500/30 p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Total Revenue</p>
              <p className="text-3xl font-bold text-white mb-2">{formatCurrency(analyticsData.totalRevenue)}</p>
              <p className="text-green-400 text-sm flex items-center gap-1">
                <TrendingUp size={14} />
                +{trends.revenueGrowth}% vs last period
              </p>
            </div>
            <div className="bg-blue-500/20 p-3 rounded-lg">
              <DollarSign size={24} className="text-blue-400" />
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-green-600/20 to-green-400/10 border-green-500/30 p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Avg. Occupancy</p>
              <p className="text-3xl font-bold text-white mb-2">{formatPercentage(analyticsData.averageOccupancy)}</p>
              <p className="text-green-400 text-sm flex items-center gap-1">
                <TrendingUp size={14} />
                +{trends.occupancyGrowth}% vs last period
              </p>
            </div>
            <div className="bg-green-500/20 p-3 rounded-lg">
              <Building2 size={24} className="text-green-400" />
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-purple-600/20 to-purple-400/10 border-purple-500/30 p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Collection Rate</p>
              <p className="text-3xl font-bold text-white mb-2">{formatPercentage(analyticsData.collectionRate)}</p>
              <p className="text-green-400 text-sm flex items-center gap-1">
                <TrendingUp size={14} />
                +{trends.collectionGrowth}% vs last period
              </p>
            </div>
            <div className="bg-purple-500/20 p-3 rounded-lg">
              <BarChart3 size={24} className="text-purple-400" />
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-orange-600/20 to-orange-400/10 border-orange-500/30 p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Maintenance Cost</p>
              <p className="text-3xl font-bold text-white mb-2">{formatCurrency(analyticsData.maintenanceCost)}</p>
              <p className="text-green-400 text-sm flex items-center gap-1">
                <TrendingUp size={14} />
                {trends.maintenanceGrowth}% vs last period
              </p>
            </div>
            <div className="bg-orange-500/20 p-3 rounded-lg">
              <DollarSign size={24} className="text-orange-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="bg-white/5 border-white/10 p-6">
          <p className="text-gray-400 text-sm mb-2">Total Properties</p>
          <p className="text-3xl font-bold text-white">{analyticsData.totalProperties}</p>
        </Card>

        <Card className="bg-white/5 border-white/10 p-6">
          <p className="text-gray-400 text-sm mb-2">Active Leases</p>
          <p className="text-3xl font-bold text-white">{analyticsData.activeLeases}</p>
        </Card>

        <Card className="bg-white/5 border-white/10 p-6">
          <p className="text-gray-400 text-sm mb-2">Average Rent</p>
          <p className="text-3xl font-bold text-white">{formatCurrency(analyticsData.averageRent)}</p>
        </Card>

        <Card className="bg-white/5 border-white/10 p-6">
          <p className="text-gray-400 text-sm mb-2">Tenant Retention</p>
          <p className="text-3xl font-bold text-white">{formatPercentage(analyticsData.tenantRetention)}</p>
        </Card>
      </div>

      {/* Property Performance */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-6">Property Performance</h2>
        <div className="space-y-4">
          {propertyMetrics.map((property) => (
            <Card
              key={property.propertyId}
              className="bg-gradient-to-r from-white/5 to-white/[0.02] border-white/10 p-6 hover:border-purple-500/50 transition-all cursor-pointer"
              onClick={() => {
                setSelectedProperty(property.propertyName);
                setShowDetailModal(true);
              }}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">{property.propertyName}</h3>
                  <p className="text-gray-400 text-sm">{property.tenantCount} tenants</p>
                </div>
                <button className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white">
                  <Eye size={18} />
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div>
                  <p className="text-gray-400 text-xs mb-2">Occupancy Rate</p>
                  <div className="w-full bg-white/10 rounded-full h-2 mb-1">
                    <div
                      className="bg-gradient-to-r from-green-600 to-green-400 h-2 rounded-full"
                      style={{ width: `${property.occupancyRate}%` }}
                    ></div>
                  </div>
                  <p className="text-white font-semibold text-sm">{formatPercentage(property.occupancyRate)}</p>
                </div>

                <div>
                  <p className="text-gray-400 text-xs mb-2">Monthly Revenue</p>
                  <p className="text-white font-semibold text-sm">{formatCurrency(property.monthlyRevenue)}</p>
                </div>

                <div>
                  <p className="text-gray-400 text-xs mb-2">Maintenance Cost</p>
                  <p className="text-white font-semibold text-sm">{formatCurrency(property.maintenanceCost)}</p>
                </div>

                <div>
                  <p className="text-gray-400 text-xs mb-2">Average Rent</p>
                  <p className="text-white font-semibold text-sm">{formatCurrency(property.averageRent)}</p>
                </div>

                <div>
                  <p className="text-gray-400 text-xs mb-2">Net Income</p>
                  <p className="text-green-400 font-semibold text-sm">
                    {formatCurrency(property.monthlyRevenue - property.maintenanceCost)}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <Card className="bg-white/5 border-white/10 p-6">
          <h3 className="text-lg font-semibold text-white mb-6">Revenue Breakdown</h3>
          <div className="space-y-4">
            {propertyMetrics.map((property) => (
              <div key={property.propertyId} className="flex items-center justify-between">
                <span className="text-gray-300">{property.propertyName}</span>
                <div className="flex items-center gap-3">
                  <div className="w-32 bg-white/10 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full"
                      style={{
                        width: `${(property.monthlyRevenue / analyticsData.totalRevenue) * 100}%`,
                      }}
                    ></div>
                  </div>
                  <span className="text-white font-semibold text-sm w-20 text-right">
                    {formatPercentage((property.monthlyRevenue / analyticsData.totalRevenue) * 100)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="bg-white/5 border-white/10 p-6">
          <h3 className="text-lg font-semibold text-white mb-6">Expense Breakdown</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Maintenance</span>
              <div className="flex items-center gap-3">
                <div className="w-32 bg-white/10 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-orange-600 to-orange-400 h-2 rounded-full"
                    style={{ width: '65%' }}
                  ></div>
                </div>
                <span className="text-white font-semibold text-sm w-20 text-right">65%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Utilities</span>
              <div className="flex items-center gap-3">
                <div className="w-32 bg-white/10 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-blue-600 to-blue-400 h-2 rounded-full"
                    style={{ width: '25%' }}
                  ></div>
                </div>
                <span className="text-white font-semibold text-sm w-20 text-right">25%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Other</span>
              <div className="flex items-center gap-3">
                <div className="w-32 bg-white/10 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-purple-600 to-purple-400 h-2 rounded-full"
                    style={{ width: '10%' }}
                  ></div>
                </div>
                <span className="text-white font-semibold text-sm w-20 text-right">10%</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Export Options */}
      <Card className="bg-white/5 border-white/10 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Export Reports</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white">
            <Download size={16} className="mr-2" />
            Export as PDF
          </Button>
          <Button className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white">
            <Download size={16} className="mr-2" />
            Export as Excel
          </Button>
          <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white">
            <Download size={16} className="mr-2" />
            Email Report
          </Button>
        </div>
      </Card>
    </RentalaLayout>
  );
}
