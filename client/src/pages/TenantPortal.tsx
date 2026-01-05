import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, Clock, DollarSign, FileText, Wrench } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useState } from "react";

export default function TenantPortal() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<"lease" | "payments" | "maintenance" | "messages">("lease");

  const leaseQuery = trpc.leases.list.useQuery();
  const paymentsQuery = trpc.payments.list.useQuery();
  const maintenanceQuery = trpc.maintenance.list.useQuery();

  if (!user || user.role !== "tenant") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-gray-600">This portal is for tenants only</p>
        </div>
      </div>
    );
  }

  const tenantLeases = leaseQuery.data || [];
  const tenantPayments = paymentsQuery.data || [];
  const tenantMaintenance = maintenanceQuery.data || [];

  // Calculate payment statistics
      const totalPaid = tenantPayments
    .filter(p => p.status === "paid")
    .reduce((sum, p) => sum + (typeof p.amount === 'string' ? parseFloat(p.amount) : p.amount), 0);

  const pendingPayments = tenantPayments.filter(p => p.status === "pending");
  const totalPending = pendingPayments.reduce((sum, p) => sum + (typeof p.amount === 'string' ? parseFloat(p.amount) : p.amount), 0);

  const overduePayments = tenantPayments.filter(p => p.status === "overdue");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white">Tenant Portal</h1>
              <p className="text-slate-400 mt-1">Welcome, {user.name}</p>
            </div>
            <Button variant="outline" onClick={logout}>
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-400">Total Paid</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">R{totalPaid.toFixed(2)}</div>
              <p className="text-xs text-slate-500 mt-1">Payments completed</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-400">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-400">R{totalPending.toFixed(2)}</div>
              <p className="text-xs text-slate-500 mt-1">{pendingPayments.length} payments due</p>
            </CardContent>
          </Card>

          <Card className={`${overduePayments.length > 0 ? "bg-red-900/20 border-red-700" : "bg-slate-800 border-slate-700"}`}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-400">Overdue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${overduePayments.length > 0 ? "text-red-400" : "text-green-400"}`}>
                R{overduePayments.reduce((sum, p) => sum + (typeof p.amount === 'string' ? parseFloat(p.amount) : p.amount), 0).toFixed(2)}
              </div>
              <p className="text-xs text-slate-500 mt-1">{overduePayments.length} overdue payments</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-400">Active Leases</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{tenantLeases.length}</div>
              <p className="text-xs text-slate-500 mt-1">Current leases</p>
            </CardContent>
          </Card>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 border-b border-slate-700">
          {[
            { id: "lease", label: "Lease", icon: FileText },
            { id: "payments", label: "Payments", icon: DollarSign },
            { id: "maintenance", label: "Maintenance", icon: Wrench },
            { id: "messages", label: "Messages", icon: AlertCircle },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-blue-500 text-blue-400"
                  : "border-transparent text-slate-400 hover:text-slate-300"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div>
          {/* Lease Tab */}
          {activeTab === "lease" && (
            <div className="space-y-4">
              {tenantLeases.length === 0 ? (
                <Card className="bg-slate-800 border-slate-700">
                  <CardContent className="pt-6 text-center text-slate-400">
                    No active leases found
                  </CardContent>
                </Card>
              ) : (
                tenantLeases.map(lease => (
                  <Card key={lease.id} className="bg-slate-800 border-slate-700">
                    <CardHeader>
                      <CardTitle className="text-white">Lease Details</CardTitle>
                      <CardDescription>Property lease information</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-slate-400">Start Date</p>
                          <p className="text-white font-semibold">{new Date(lease.startDate).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-400">End Date</p>
                          <p className="text-white font-semibold">{new Date(lease.endDate).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-400">Monthly Rent</p>
                          <p className="text-white font-semibold">R{(typeof lease.rentAmount === 'string' ? parseFloat(lease.rentAmount) : lease.rentAmount).toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-400">Deposit</p>
                          <p className="text-white font-semibold">R{(lease.deposit ? (typeof lease.deposit === 'string' ? parseFloat(lease.deposit) : lease.deposit) : 0).toFixed(2)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}

          {/* Payments Tab */}
          {activeTab === "payments" && (
            <div className="space-y-4">
              {tenantPayments.length === 0 ? (
                <Card className="bg-slate-800 border-slate-700">
                  <CardContent className="pt-6 text-center text-slate-400">
                    No payment records found
                  </CardContent>
                </Card>
              ) : (
                tenantPayments.map(payment => (
                  <Card key={payment.id} className="bg-slate-800 border-slate-700">
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {payment.status === "paid" && <CheckCircle className="w-5 h-5 text-green-400" />}
                            {payment.status === "pending" && <Clock className="w-5 h-5 text-yellow-400" />}
                            {payment.status === "overdue" && <AlertCircle className="w-5 h-5 text-red-400" />}
                            <span className="text-white font-semibold capitalize">{payment.status}</span>
                          </div>
                          <p className="text-slate-400">Due: {new Date(payment.dueDate).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-white">R{(typeof payment.amount === 'string' ? parseFloat(payment.amount) : payment.amount).toFixed(2)}</p>
                          {payment.paidDate && (
                            <p className="text-sm text-slate-400">Paid: {new Date(payment.paidDate).toLocaleDateString()}</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}

          {/* Maintenance Tab */}
          {activeTab === "maintenance" && (
            <div className="space-y-4">
              {tenantMaintenance.length === 0 ? (
                <Card className="bg-slate-800 border-slate-700">
                  <CardContent className="pt-6 text-center text-slate-400">
                    No maintenance requests found
                  </CardContent>
                </Card>
              ) : (
                tenantMaintenance.map(maintenance => (
                  <Card key={maintenance.id} className="bg-slate-800 border-slate-700">
                    <CardHeader>
                      <CardTitle className="text-white">{maintenance.title}</CardTitle>
                      <CardDescription>{maintenance.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Status:</span>
                        <span className={`font-semibold capitalize ${
                          maintenance.status === "completed" ? "text-green-400" : "text-yellow-400"
                        }`}>
                          {maintenance.status}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Priority:</span>
                        <span className="font-semibold text-white capitalize">{maintenance.priority}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}

          {/* Messages Tab */}
          {activeTab === "messages" && (
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="pt-6 text-center text-slate-400">
                Messages feature coming soon
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
