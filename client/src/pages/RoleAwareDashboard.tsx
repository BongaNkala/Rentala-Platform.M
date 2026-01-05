import { useAuth } from "@/_core/hooks/useAuth";
import Dashboard from "./Dashboard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Wrench, DollarSign, FileText } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function RoleAwareDashboard() {
  const { user } = useAuth();

  if (!user) return null;

  // Landlord dashboard - financial and property focused
  if (user.role === "landlord" || user.role === "agency_admin" || user.role === "super_admin") {
    return <LandlordDashboard />;
  }

  // Staff dashboard - maintenance and tenant focused
  if (user.role === "staff") {
    return <StaffDashboard />;
  }

  return <Dashboard />;
}

function LandlordDashboard() {
  const { user } = useAuth();
  const propertiesQuery = trpc.properties.list.useQuery();
  const paymentsQuery = trpc.payments.list.useQuery();
  const maintenanceQuery = trpc.maintenance.list.useQuery();
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const endOfMonth = today.toISOString().split('T')[0];
  const accountingQuery = trpc.accounting.getSummary.useQuery({ startDate: startOfMonth, endDate: endOfMonth });

  const properties = propertiesQuery.data || [];
  const payments = paymentsQuery.data || [];
  const maintenance = maintenanceQuery.data || [];
  const accounting = accountingQuery.data;

  // Calculate key metrics
  const totalProperties = properties.length;
  const occupiedUnits = properties.filter(p => p.status === "active").length;
  const totalIncome = typeof accounting?.totalIncome === 'string' ? parseFloat(accounting.totalIncome) : (accounting?.totalIncome || 0);
  const totalExpenses = typeof accounting?.totalExpenses === 'string' ? parseFloat(accounting.totalExpenses) : (accounting?.totalExpenses || 0);
  const pendingPayments = payments.filter(p => p.status === "pending").length;
  const overduePayments = payments.filter(p => p.status === "overdue").length;
  const maintenanceRequests = maintenance.filter(m => m.status !== "completed").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Landlord Dashboard</h1>
        <p className="text-slate-400 mt-1">Financial overview and property management</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-400">Total Income</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">R{totalIncome.toFixed(2)}</div>
            <p className="text-xs text-slate-500 mt-1">This period</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-400">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-400">R{totalExpenses.toFixed(2)}</div>
            <p className="text-xs text-slate-500 mt-1">This period</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-400">Net Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${(totalIncome as number) - (totalExpenses as number) >= 0 ? "text-blue-400" : "text-red-400"}`}>
              R{((totalIncome as number) - (totalExpenses as number)).toFixed(2)}
            </div>
            <p className="text-xs text-slate-500 mt-1">This period</p>
          </CardContent>
        </Card>
      </div>

      {/* Property Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Properties</CardTitle>
            <CardDescription>Portfolio overview</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-400">Total Properties</span>
              <span className="font-semibold text-white">{totalProperties}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Occupied Units</span>
              <span className="font-semibold text-green-400">{occupiedUnits}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Vacant Units</span>
              <span className="font-semibold text-yellow-400">{totalProperties - occupiedUnits}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Payment Status</CardTitle>
            <CardDescription>Rent collection</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-400">Pending Payments</span>
              <span className="font-semibold text-yellow-400">{pendingPayments}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Overdue Payments</span>
              <span className={`font-semibold ${overduePayments > 0 ? "text-red-400" : "text-green-400"}`}>
                {overduePayments}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Collection Rate</span>
              <span className="font-semibold text-blue-400">
                {payments.length > 0 ? ((payments.filter(p => p.status === "paid").length / payments.length) * 100).toFixed(0) : 0}%
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {(overduePayments > 0 || maintenanceRequests > 0) && (
        <Card className="bg-red-900/20 border-red-700">
          <CardHeader>
            <CardTitle className="text-red-400 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Action Required
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {overduePayments > 0 && (
              <p className="text-red-300">{overduePayments} overdue rent payments require attention</p>
            )}
            {maintenanceRequests > 0 && (
              <p className="text-red-300">{maintenanceRequests} maintenance requests pending</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StaffDashboard() {
  const { user } = useAuth();
  const maintenanceQuery = trpc.maintenance.list.useQuery();
  const inspectionsQuery = trpc.inspections.list.useQuery();

  const maintenance = maintenanceQuery.data || [];
  const inspections = inspectionsQuery.data || [];

  const pendingMaintenance = maintenance.filter(m => m.status !== "completed");
  const urgentMaintenance = maintenance.filter(m => m.priority === "urgent" && m.status !== "completed");
  const pendingInspections = inspections.filter(i => i.status !== "completed");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Staff Dashboard</h1>
        <p className="text-slate-400 mt-1">Maintenance and inspection management</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
              <Wrench className="w-4 h-4" />
              Pending Maintenance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-400">{pendingMaintenance.length}</div>
            <p className="text-xs text-slate-500 mt-1">Awaiting completion</p>
          </CardContent>
        </Card>

        <Card className={`${urgentMaintenance.length > 0 ? "bg-red-900/20 border-red-700" : "bg-slate-800 border-slate-700"}`}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Urgent Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${urgentMaintenance.length > 0 ? "text-red-400" : "text-green-400"}`}>
              {urgentMaintenance.length}
            </div>
            <p className="text-xs text-slate-500 mt-1">High priority</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Pending Inspections
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-400">{pendingInspections.length}</div>
            <p className="text-xs text-slate-500 mt-1">Awaiting completion</p>
          </CardContent>
        </Card>
      </div>

      {/* Urgent Maintenance Alert */}
      {urgentMaintenance.length > 0 && (
        <Card className="bg-red-900/20 border-red-700">
          <CardHeader>
            <CardTitle className="text-red-400 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Urgent Maintenance Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {urgentMaintenance.slice(0, 3).map(m => (
                <div key={m.id} className="text-red-300 text-sm">
                  • {m.title} - {m.category}
                </div>
              ))}
              {urgentMaintenance.length > 3 && (
                <p className="text-red-300 text-sm mt-2">+ {urgentMaintenance.length - 3} more urgent requests</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
