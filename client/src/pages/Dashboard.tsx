import React from 'react';
import RentalaLayout from '@/components/RentalaLayout';
import { Card } from '@/components/ui/card';
import { Building2, DoorOpen, Users, FileText, TrendingUp, AlertCircle } from 'lucide-react';

export default function Dashboard() {
  const stats = [
    {
      title: 'Total Properties',
      value: '12',
      icon: Building2,
      color: 'from-blue-500 to-blue-600',
      trend: '+2 this month',
    },
    {
      title: 'Occupied Units',
      value: '45',
      icon: DoorOpen,
      color: 'from-green-500 to-green-600',
      trend: '94% occupancy',
    },
    {
      title: 'Active Tenants',
      value: '48',
      icon: Users,
      color: 'from-purple-500 to-purple-600',
      trend: '+5 new this month',
    },
    {
      title: 'Pending Payments',
      value: 'R 45,200',
      icon: FileText,
      color: 'from-orange-500 to-orange-600',
      trend: '3 overdue',
    },
  ];

  const recentTransactions = [
    { id: 1, tenant: 'John Doe', property: 'Sunset Apartments', amount: 'R 8,500', date: '2024-01-03', status: 'paid' },
    { id: 2, tenant: 'Jane Smith', property: 'Downtown Complex', amount: 'R 6,200', date: '2024-01-02', status: 'pending' },
    { id: 3, tenant: 'Mike Johnson', property: 'Garden Heights', amount: 'R 7,800', date: '2024-01-01', status: 'paid' },
    { id: 4, tenant: 'Sarah Williams', property: 'Riverside Towers', amount: 'R 5,500', date: '2023-12-31', status: 'overdue' },
  ];

  const maintenanceRequests = [
    { id: 1, unit: 'Unit 4A', issue: 'Leaking tap', priority: 'low', date: '2024-01-03' },
    { id: 2, unit: 'Unit 7B', issue: 'AC not working', priority: 'high', date: '2024-01-02' },
    { id: 3, unit: 'Unit 2C', issue: 'Door lock broken', priority: 'urgent', date: '2024-01-01' },
  ];

  return (
    <RentalaLayout pageTitle="Dashboard" pageSubtitle="Welcome back to your property management hub">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card
              key={index}
              className="bg-white/10 border border-white/20 hover:border-white/40 transition-all duration-300 p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 bg-gradient-to-br ${stat.color} rounded-lg`}>
                  <Icon size={24} className="text-white" />
                </div>
              </div>
              <h3 className="text-white/70 text-sm font-medium mb-2">{stat.title}</h3>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-3xl font-bold text-white">{stat.value}</p>
                  <p className="text-xs text-white/50 mt-1">{stat.trend}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions */}
        <div className="lg:col-span-2">
          <Card className="bg-white/10 border border-white/20 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Recent Transactions</h2>
              <button className="text-blue-400 hover:text-blue-300 text-sm font-medium">View All</button>
            </div>

            <div className="space-y-4">
              {recentTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10 hover:border-white/20 transition-colors"
                >
                  <div>
                    <p className="text-white font-medium">{transaction.tenant}</p>
                    <p className="text-white/60 text-sm">{transaction.property}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-semibold">{transaction.amount}</p>
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded-full ${
                        transaction.status === 'paid'
                          ? 'bg-green-500/20 text-green-300'
                          : transaction.status === 'pending'
                          ? 'bg-yellow-500/20 text-yellow-300'
                          : 'bg-red-500/20 text-red-300'
                      }`}
                    >
                      {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Maintenance Requests */}
        <div>
          <Card className="bg-white/10 border border-white/20 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Maintenance Requests</h2>
              <AlertCircle size={20} className="text-orange-400" />
            </div>

            <div className="space-y-4">
              {maintenanceRequests.map((request) => (
                <div
                  key={request.id}
                  className="p-4 bg-white/5 rounded-lg border border-white/10 hover:border-white/20 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-white font-medium">{request.unit}</p>
                    <span
                      className={`text-xs font-semibold px-2 py-1 rounded-full ${
                        request.priority === 'urgent'
                          ? 'bg-red-500/20 text-red-300'
                          : request.priority === 'high'
                          ? 'bg-orange-500/20 text-orange-300'
                          : 'bg-yellow-500/20 text-yellow-300'
                      }`}
                    >
                      {request.priority.charAt(0).toUpperCase() + request.priority.slice(1)}
                    </span>
                  </div>
                  <p className="text-white/60 text-sm mb-2">{request.issue}</p>
                  <p className="text-white/40 text-xs">{request.date}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </RentalaLayout>
  );
}
