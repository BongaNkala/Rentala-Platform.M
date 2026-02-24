import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useMetricPreferences, useSchedulePreferences } from "@/hooks/useMetricPreferences";
import { exportPreferences, generateExportFilename, downloadPreferencesFile, parseImportedPreferences, mergePreferences, replacePreferences } from "@/utils/preferenceExport";

type ReportMetric = "overall" | "cleanliness" | "maintenance" | "communication" | "responsiveness" | "value" | "surveys" | "recommendations";

const METRIC_LABELS: Record<ReportMetric, string> = {
  overall: "Overall Satisfaction",
  cleanliness: "Cleanliness",
  maintenance: "Maintenance",
  communication: "Communication",
  responsiveness: "Responsiveness",
  value: "Value for Money",
  surveys: "Survey Count",
  recommendations: "Recommendations",
};

export default function Analytics() {
  const [months, setMonths] = useState(12);
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | undefined>(undefined);
  const [isExporting, setIsExporting] = useState(false);
  const [showMetricSelector, setShowMetricSelector] = useState(false);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [showPreferenceMenu, setShowPreferenceMenu] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importMessage, setImportMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Load preferences from localStorage
  const metricPrefs = useMetricPreferences();
  const schedulePrefs = useSchedulePreferences();
  const [selectedMetrics, setSelectedMetrics] = useState<ReportMetric[]>(metricPrefs.selectedMetrics);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced'>('idle');
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [selectedVersionId, setSelectedVersionId] = useState<number | null>(null);
  const [restoreMessage, setRestoreMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Server preference queries
  const serverPrefsQuery = trpc.userPreferences.get.useQuery();
  const savePreferencesMutation = trpc.userPreferences.save.useMutation();
  
  // Version history queries
  const versionsQuery = trpc.preferenceVersions.getVersions.useQuery();
  const restoreVersionMutation = trpc.preferenceVersions.restore.useMutation();
  const deleteVersionMutation = trpc.preferenceVersions.delete.useMutation();
  const [scheduleForm, setScheduleForm] = useState({
    name: "",
    description: "",
    frequency: schedulePrefs.defaultFrequency,
    recipientEmails: "",
    dayOfMonth: schedulePrefs.defaultDayOfMonth,
    hour: schedulePrefs.defaultHour,
    minute: schedulePrefs.defaultMinute,
  });

  // Save metric preferences when they change
  const handleMetricsChange = (metrics: ReportMetric[]) => {
    setSelectedMetrics(metrics);
    metricPrefs.updateMetrics(metrics);
  };

  // Save schedule preferences when form changes
  const handleScheduleFormChange = (updates: Record<string, any>) => {
    setScheduleForm({ ...scheduleForm, ...updates });
    schedulePrefs.updateSchedulePreferences({
      defaultFrequency: updates.frequency || scheduleForm.frequency,
      defaultHour: updates.hour !== undefined ? updates.hour : scheduleForm.hour,
      defaultMinute: updates.minute !== undefined ? updates.minute : scheduleForm.minute,
      defaultDayOfMonth: updates.dayOfMonth || scheduleForm.dayOfMonth,
    });
  };

  // Export preferences handler
  const handleExportPreferences = () => {
    try {
      const content = exportPreferences(
        { selectedMetrics: selectedMetrics, lastUpdated: Date.now() },
        {
          defaultFrequency: scheduleForm.frequency as any,
          defaultHour: scheduleForm.hour,
          defaultMinute: scheduleForm.minute,
          defaultDayOfMonth: scheduleForm.dayOfMonth,
          lastUpdated: Date.now(),
        }
      );
      const filename = generateExportFilename();
      downloadPreferencesFile(content, filename);
      setImportMessage({ type: 'success', text: 'Preferences exported successfully!' });
      setTimeout(() => setImportMessage(null), 3000);
    } catch (error) {
      setImportMessage({ type: 'error', text: 'Failed to export preferences' });
    }
  };

  const handleImportPreferences = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const result = parseImportedPreferences(content);
        if (!result.success) {
          setImportMessage({ type: 'error', text: result.error || 'Invalid preferences file' });
          return;
        }
        setShowImportDialog(true);
      } catch (error) {
        setImportMessage({ type: 'error', text: 'Failed to read preferences file' });
      }
    };
    reader.readAsText(file);
  };

  // Sync preferences on mount
  useEffect(() => {
    const syncPreferences = async () => {
      if (!serverPrefsQuery.data) return;
      setSyncStatus('syncing');
      try {
        // Load server preferences if available
        if (serverPrefsQuery.data) {
          setSelectedMetrics(serverPrefsQuery.data.metrics.selectedMetrics as ReportMetric[]);
        }
        setSyncStatus('synced');
      } catch (error) {
        console.error('Failed to sync preferences:', error);
        setSyncStatus('idle');
      }
    };
    syncPreferences();
  }, [serverPrefsQuery.data]);
  
  // Auto-save preferences to server when they change
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (selectedMetrics.length > 0) {
        await savePreferencesMutation.mutateAsync({
          metrics: { selectedMetrics, lastUpdated: Date.now() },
          schedule: {
            defaultFrequency: scheduleForm.frequency as any,
            defaultHour: scheduleForm.hour,
            defaultMinute: scheduleForm.minute,
            defaultDayOfMonth: scheduleForm.dayOfMonth,
            lastUpdated: Date.now(),
          },
        });
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [selectedMetrics, scheduleForm]);

  // Fetch properties list for filtering
  const propertiesQuery = trpc.propertyAnalytics.getProperties.useQuery();
  const exportMutation = trpc.propertyAnalytics.exportSatisfactionReport.useMutation();
  const schedulesQuery = trpc.reportSchedules.getSchedules.useQuery();
  const createScheduleMutation = trpc.reportSchedules.createSchedule.useMutation();
  const testSendMutation = trpc.reportSchedules.testSendReport.useMutation();
  const deleteScheduleMutation = trpc.reportSchedules.deleteSchedule.useMutation();

  // Fetch analytics data
  const vacancyQuery = trpc.propertyAnalytics.getVacancyTrends.useQuery({ months });
  const incomeQuery = trpc.propertyAnalytics.getIncomeForecast.useQuery({ months });
  const maintenanceQuery = trpc.propertyAnalytics.getMaintenanceCosts.useQuery();
  const paymentQuery = trpc.propertyAnalytics.getTenantPaymentBehavior.useQuery();
  const performanceQuery = trpc.propertyAnalytics.getPropertyPerformance.useQuery();
  const satisfactionQuery = trpc.propertyAnalytics.getTenantSatisfactionTrends.useQuery({ months, propertyId: selectedPropertyId });

  const COLORS = ["#4361ee", "#7209b7", "#4cc9f0", "#f72585", "#4895ef", "#560bad"];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Analytics Dashboard</h1>
          <p className="text-gray-400 mt-2">Property performance and financial insights</p>
        </div>
        <div className="flex gap-2 items-center">
          {/* Property Selector */}
          <select
            value={selectedPropertyId || ""}
            onChange={(e) => setSelectedPropertyId(e.target.value ? parseInt(e.target.value) : undefined)}
            className="px-3 py-2 bg-purple-900/50 border border-purple-500/30 rounded text-white text-sm focus:outline-none focus:border-purple-500"
          >
            <option value="">All Properties</option>
            {propertiesQuery.data?.map((prop) => (
              <option key={prop.id} value={prop.id}>
                {prop.name}
              </option>
            ))}
          </select>
          <Button
            variant={months === 6 ? "default" : "outline"}
            onClick={() => setMonths(6)}
            className="bg-purple-600 hover:bg-purple-700"
          >
            6 Months
          </Button>
          <Button
            variant={months === 12 ? "default" : "outline"}
            onClick={() => setMonths(12)}
            className="bg-purple-600 hover:bg-purple-700"
          >
            12 Months
          </Button>
          <Button
            variant={months === 24 ? "default" : "outline"}
            onClick={() => setMonths(24)}
            className="bg-purple-600 hover:bg-purple-700"
          >
            24 Months
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="vacancy" className="w-full">
        <TabsList className="grid w-full grid-cols-6 bg-purple-900/50 border border-purple-500/30">
          <TabsTrigger value="vacancy">Vacancy Trends</TabsTrigger>
          <TabsTrigger value="income">Income Forecast</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance Costs</TabsTrigger>
          <TabsTrigger value="payments">Payment Behavior</TabsTrigger>
          <TabsTrigger value="satisfaction">Tenant Satisfaction</TabsTrigger>
          <TabsTrigger value="schedules">Report Schedules</TabsTrigger>
          <TabsTrigger value="versions">Preference History</TabsTrigger>
        </TabsList>

        {/* Vacancy Trends Tab */}
        <TabsContent value="vacancy" className="space-y-4">
          <Card className="bg-purple-900/30 border border-purple-500/30 p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Vacancy Rate Trends</h2>
            {vacancyQuery.isLoading ? (
              <div className="h-80 flex items-center justify-center text-gray-400">
                Loading...
              </div>
            ) : vacancyQuery.data ? (
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={vacancyQuery.data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                  <XAxis dataKey="month" stroke="#999" />
                  <YAxis stroke="#999" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1a1a2e",
                      border: "1px solid #4361ee",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="vacancyRate"
                    stroke="#4cc9f0"
                    strokeWidth={2}
                    dot={{ fill: "#4cc9f0" }}
                    name="Vacancy Rate (%)"
                  />
                  <Line
                    type="monotone"
                    dataKey="occupiedUnits"
                    stroke="#4361ee"
                    strokeWidth={2}
                    dot={{ fill: "#4361ee" }}
                    name="Occupied Units"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : null}
          </Card>
        </TabsContent>

        {/* Income Forecast Tab */}
        <TabsContent value="income" className="space-y-4">
          <Card className="bg-purple-900/30 border border-purple-500/30 p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Income Forecast vs Actual</h2>
            {incomeQuery.isLoading ? (
              <div className="h-80 flex items-center justify-center text-gray-400">
                Loading...
              </div>
            ) : incomeQuery.data ? (
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={incomeQuery.data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                  <XAxis dataKey="month" stroke="#999" />
                  <YAxis stroke="#999" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1a1a2e",
                      border: "1px solid #4361ee",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="projectedIncome"
                    stroke="#4361ee"
                    fill="#4361ee"
                    fillOpacity={0.3}
                    name="Projected Income"
                  />
                  <Area
                    type="monotone"
                    dataKey="actualIncome"
                    stroke="#4cc9f0"
                    fill="#4cc9f0"
                    fillOpacity={0.3}
                    name="Actual Income"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : null}
          </Card>
        </TabsContent>

        {/* Maintenance Costs Tab */}
        <TabsContent value="maintenance" className="space-y-4">
          <Card className="bg-purple-900/30 border border-purple-500/30 p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Maintenance Cost Breakdown</h2>
            {maintenanceQuery.isLoading ? (
              <div className="h-80 flex items-center justify-center text-gray-400">
                Loading...
              </div>
            ) : maintenanceQuery.data ? (
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={maintenanceQuery.data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                  <XAxis dataKey="category" stroke="#999" />
                  <YAxis stroke="#999" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1a1a2e",
                      border: "1px solid #4361ee",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Bar dataKey="totalCost" fill="#f72585" name="Total Cost" />
                  <Bar dataKey="count" fill="#4361ee" name="Request Count" />
                </BarChart>
              </ResponsiveContainer>
            ) : null}
          </Card>
        </TabsContent>

        {/* Payment Behavior Tab */}
        <TabsContent value="payments" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-purple-900/30 border border-purple-500/30 p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Payment Status Distribution</h2>
              {paymentQuery.isLoading ? (
                <div className="h-80 flex items-center justify-center text-gray-400">
                  Loading...
                </div>
              ) : paymentQuery.data ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={paymentQuery.data}
                      dataKey="count"
                      nameKey="status"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label
                    >
                      {paymentQuery.data.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1a1a2e",
                        border: "1px solid #4361ee",
                        borderRadius: "8px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : null}
            </Card>

            <Card className="bg-purple-900/30 border border-purple-500/30 p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Payment Summary</h2>
              {paymentQuery.isLoading ? (
                <div className="space-y-4">
                  <div className="h-12 bg-purple-800/30 rounded animate-pulse" />
                  <div className="h-12 bg-purple-800/30 rounded animate-pulse" />
                </div>
              ) : paymentQuery.data ? (
                <div className="space-y-4">
                  {paymentQuery.data.map((item) => (
                    <div key={item.status} className="flex justify-between items-center p-3 bg-purple-800/20 rounded">
                      <div>
                        <p className="text-white font-medium capitalize">{item.status}</p>
                        <p className="text-gray-400 text-sm">{item.count} payments</p>
                      </div>
                      <div className="text-right">
                        <p className="text-cyan-400 font-semibold">R {item.totalAmount.toLocaleString()}</p>
                        <p className="text-gray-400 text-sm">{item.percentage}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </Card>
          </div>
        </TabsContent>

        {/* Tenant Satisfaction Tab */}
        <TabsContent value="satisfaction" className="space-y-4">
          {showMetricSelector && (
            <Card className="bg-purple-900/30 border border-purple-500/30 p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-white">Select Report Metrics</h3>
                <Button variant="outline" size="sm" onClick={() => setShowMetricSelector(false)}>
                  Done
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {(Object.keys(METRIC_LABELS) as ReportMetric[]).map((metric) => (
                  <label key={metric} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedMetrics.includes(metric)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          handleMetricsChange([...selectedMetrics, metric]);
                        } else {
                          handleMetricsChange(selectedMetrics.filter((m) => m !== metric));
                        }
                      }}
                      className="w-4 h-4"
                    />
                    <span className="text-white">{METRIC_LABELS[metric]}</span>
                  </label>
                ))}
              </div>
              <div className="flex gap-2 mt-4">
                <Button size="sm" variant="outline" onClick={() => handleMetricsChange(Object.keys(METRIC_LABELS) as ReportMetric[])}>
                  Select All
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleMetricsChange([])}>
                  Deselect All
                </Button>
                {!metricPrefs.isUsingDefaults && (
                  <Button size="sm" variant="outline" className="text-orange-400 border-orange-500/30" onClick={() => metricPrefs.resetPreferences()}>
                    Reset to Default
                  </Button>
                )}
              </div>
              {!metricPrefs.isUsingDefaults && (
                <p className="text-xs text-gray-400 mt-2">Using saved preferences</p>
              )}
            </Card>
          )}

          {importMessage && (
            <div className={`p-3 rounded mb-4 text-sm ${importMessage.type === 'success' ? 'bg-green-900/30 text-green-400 border border-green-500/30' : 'bg-red-900/30 text-red-400 border border-red-500/30'}`}>
              {importMessage.text}
            </div>
          )}

          <div className="flex justify-end gap-2 mb-4">
            <div className="relative">
              <Button onClick={() => setShowPreferenceMenu(!showPreferenceMenu)} variant="outline" className="border-blue-500 text-blue-400 hover:bg-blue-900/30">
                Preferences
              </Button>
              {showPreferenceMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-purple-900 border border-purple-500/30 rounded shadow-lg z-10">
                  <button onClick={handleExportPreferences} className="w-full text-left px-4 py-2 text-white hover:bg-purple-800/50 border-b border-purple-500/20">
                    Export Preferences
                  </button>
                  <button onClick={() => fileInputRef.current?.click()} className="w-full text-left px-4 py-2 text-white hover:bg-purple-800/50">
                    Import Preferences
                  </button>
                  <input ref={fileInputRef} type="file" accept=".json" onChange={handleImportPreferences} className="hidden" />
                </div>
              )}
            </div>
            <Button onClick={() => setShowMetricSelector(!showMetricSelector)} variant="outline" className="border-purple-500 text-purple-400 hover:bg-purple-900/30">
              {showMetricSelector ? "Hide Metrics" : "Select Metrics"}
            </Button>
            <Button
              onClick={async () => {
                setIsExporting(true);
                try {
                  const result = await exportMutation.mutateAsync({
                    months,
                    propertyId: selectedPropertyId,
                    metrics: selectedMetrics,
                  });
                  if (result.success) {
                    const link = document.createElement("a");
                    link.href = `data:application/pdf;base64,${result.pdf}`;
                    link.download = result.filename;
                    link.click();
                  }
                } catch (error) {
                  console.error("Failed to export report:", error);
                } finally {
                  setIsExporting(false);
                }
              }}
              disabled={isExporting || satisfactionQuery.isLoading}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isExporting ? "Generating PDF..." : "Export as PDF"}
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-purple-900/30 border border-purple-500/30 p-6 lg:col-span-2">
              <h2 className="text-xl font-semibold text-white mb-4">Overall Satisfaction Trends</h2>
              {satisfactionQuery.isLoading ? (
                <div className="h-80 flex items-center justify-center text-gray-400">
                  Loading...
                </div>
              ) : satisfactionQuery.data && satisfactionQuery.data.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={satisfactionQuery.data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                    <XAxis dataKey="month" stroke="#999" />
                    <YAxis stroke="#999" domain={[0, 5]} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1a1a2e",
                        border: "1px solid #4361ee",
                        borderRadius: "8px",
                      }}
                      formatter={(value: number) => value.toFixed(1)}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="averageSatisfaction"
                      stroke="#4cc9f0"
                      strokeWidth={2}
                      dot={{ fill: "#4cc9f0" }}
                      name="Overall Satisfaction"
                    />
                    <Line
                      type="monotone"
                      dataKey="averageCommunication"
                      stroke="#4361ee"
                      strokeWidth={2}
                      dot={{ fill: "#4361ee" }}
                      name="Communication"
                    />
                    <Line
                      type="monotone"
                      dataKey="averageResponsiveness"
                      stroke="#f72585"
                      strokeWidth={2}
                      dot={{ fill: "#f72585" }}
                      name="Responsiveness"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-80 flex items-center justify-center text-gray-400">
                  No satisfaction data available
                </div>
              )}
            </Card>

            <Card className="bg-purple-900/30 border border-purple-500/30 p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Category Ratings</h2>
              {satisfactionQuery.isLoading ? (
                <div className="h-80 flex items-center justify-center text-gray-400">
                  Loading...
                </div>
              ) : satisfactionQuery.data && satisfactionQuery.data.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={satisfactionQuery.data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                    <XAxis dataKey="month" stroke="#999" />
                    <YAxis stroke="#999" domain={[0, 5]} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1a1a2e",
                        border: "1px solid #4361ee",
                        borderRadius: "8px",
                      }}
                      formatter={(value: number) => value.toFixed(1)}
                    />
                    <Legend />
                    <Bar dataKey="averageCleanliness" fill="#4361ee" name="Cleanliness" />
                    <Bar dataKey="averageMaintenance" fill="#4cc9f0" name="Maintenance" />
                    <Bar dataKey="averageValueForMoney" fill="#f72585" name="Value for Money" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-80 flex items-center justify-center text-gray-400">
                  No satisfaction data available
                </div>
              )}
            </Card>

            <Card className="bg-purple-900/30 border border-purple-500/30 p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Satisfaction Summary</h2>
              {satisfactionQuery.isLoading ? (
                <div className="space-y-4">
                  <div className="h-12 bg-purple-800/30 rounded animate-pulse" />
                  <div className="h-12 bg-purple-800/30 rounded animate-pulse" />
                </div>
              ) : satisfactionQuery.data && satisfactionQuery.data.length > 0 ? (
                <div className="space-y-4">
                  {satisfactionQuery.data.map((item) => (
                    <div key={item.month} className="p-3 bg-purple-800/20 rounded">
                      <p className="text-white font-medium">{item.month}</p>
                      <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                        <div>
                          <p className="text-gray-400">Surveys</p>
                          <p className="text-cyan-400 font-semibold">{item.surveyCount}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Would Recommend</p>
                          <p className="text-green-400 font-semibold">{item.recommendPercentage}%</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-400 text-center py-8">No satisfaction data available</div>
              )}
            </Card>
          </div>
        </TabsContent>

      {/* Property Performance Tab */}
      <TabsContent value="performance" className="space-y-4">
        <Card className="bg-purple-900/30 border border-purple-500/30 p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Property Performance</h2>
          {performanceQuery.isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-purple-800/30 rounded animate-pulse" />
              ))}
            </div>
          ) : performanceQuery.data ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-purple-500/30">
                    <th className="text-left py-3 px-4 text-gray-400">Property</th>
                    <th className="text-center py-3 px-4 text-gray-400">Units</th>
                    <th className="text-center py-3 px-4 text-gray-400">Occupancy</th>
                    <th className="text-center py-3 px-4 text-gray-400">Vacancy Rate</th>
                    <th className="text-right py-3 px-4 text-gray-400">Monthly Income</th>
                    <th className="text-right py-3 px-4 text-gray-400">Maintenance</th>
                    <th className="text-right py-3 px-4 text-gray-400">Net Income</th>
                  </tr>
                </thead>
                <tbody>
                  {performanceQuery.data.map((prop) => (
                    <tr key={prop.propertyId} className="border-b border-purple-500/20 hover:bg-purple-800/20">
                      <td className="py-3 px-4 text-white">{prop.propertyName}</td>
                      <td className="text-center py-3 px-4 text-gray-300">{prop.totalUnits}</td>
                      <td className="text-center py-3 px-4 text-gray-300">
                        {prop.occupiedUnits}/{prop.totalUnits}
                      </td>
                      <td className="text-center py-3 px-4">
                        <span className={prop.vacancyRate > 20 ? "text-red-400" : "text-green-400"}>
                          {prop.vacancyRate.toFixed(1)}%
                        </span>
                      </td>
                      <td className="text-right py-3 px-4 text-cyan-400">
                        R {prop.monthlyIncome.toLocaleString()}
                      </td>
                      <td className="text-right py-3 px-4 text-orange-400">
                        R {prop.maintenanceCost.toLocaleString()}
                      </td>
                      <td className="text-right py-3 px-4 text-green-400 font-semibold">
                        R {prop.netIncome.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </Card>
      </TabsContent>

      {/* Report Schedules Tab */}
      <TabsContent value="schedules" className="space-y-4">
          <div className="flex justify-end mb-4">
            <Button
              onClick={() => setShowScheduleForm(!showScheduleForm)}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {showScheduleForm ? "Cancel" : "Create Schedule"}
            </Button>
          </div>

          {showScheduleForm && (
            <Card className="bg-purple-900/30 border border-purple-500/30 p-6 space-y-4">
              <h3 className="text-lg font-semibold text-white">Create Report Schedule</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Schedule Name</label>
                  <input
                    type="text"
                    value={scheduleForm.name}
                    onChange={(e) => handleScheduleFormChange({ name: e.target.value })}
                    className="w-full bg-purple-900/50 border border-purple-500/30 rounded px-3 py-2 text-white"
                    placeholder="e.g., Monthly Satisfaction Report"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Frequency</label>
                  <select
                    value={scheduleForm.frequency}
                    onChange={(e) => handleScheduleFormChange({ frequency: e.target.value })}
                    className="w-full bg-purple-900/50 border border-purple-500/30 rounded px-3 py-2 text-white"
                  >
                    <option value="weekly">Weekly</option>
                    <option value="biweekly">Bi-weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="annually">Annually</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-2">Recipient Emails (comma-separated)</label>
                <input
                  type="text"
                  value={scheduleForm.recipientEmails}
                    onChange={(e) => handleScheduleFormChange({ recipientEmails: e.target.value })}
                  className="w-full bg-purple-900/50 border border-purple-500/30 rounded px-3 py-2 text-white"
                  placeholder="email1@example.com, email2@example.com"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Day of Month</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={scheduleForm.dayOfMonth}
                    onChange={(e) => handleScheduleFormChange({ dayOfMonth: parseInt(e.target.value) })}
                    className="w-full bg-purple-900/50 border border-purple-500/30 rounded px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Hour</label>
                  <input
                    type="number"
                    min="0"
                    max="23"
                    value={scheduleForm.hour}
                    onChange={(e) => handleScheduleFormChange({ hour: parseInt(e.target.value) })}
                    className="w-full bg-purple-900/50 border border-purple-500/30 rounded px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Minute</label>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={scheduleForm.minute}
                    onChange={(e) => handleScheduleFormChange({ minute: parseInt(e.target.value) })}
                    className="w-full bg-purple-900/50 border border-purple-500/30 rounded px-3 py-2 text-white"
                  />
                </div>
              </div>
              <Button
                onClick={async () => {
                  const emails = scheduleForm.recipientEmails.split(",").map((e) => e.trim()).filter((e) => e);
                  if (emails.length === 0) {
                    alert("Please enter at least one recipient email");
                    return;
                  }
                  try {
                    await createScheduleMutation.mutateAsync({
                      name: scheduleForm.name,
                      description: scheduleForm.description,
                      frequency: scheduleForm.frequency,
                      recipientEmails: emails,
                      metrics: selectedMetrics,
                      propertyId: selectedPropertyId,
                      dayOfMonth: scheduleForm.dayOfMonth,
                      hour: scheduleForm.hour,
                      minute: scheduleForm.minute,
                    });
                    setShowScheduleForm(false);
                    setScheduleForm({ name: "", description: "", frequency: "monthly", recipientEmails: "", dayOfMonth: 1, hour: 9, minute: 0 });
                    await schedulesQuery.refetch();
                  } catch (error) {
                    alert("Failed to create schedule");
                  }
                }}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                Create Schedule
              </Button>
            </Card>
          )}

          {schedulesQuery.isLoading ? (
            <div className="text-center text-gray-400">Loading schedules...</div>
          ) : schedulesQuery.data && schedulesQuery.data.length > 0 ? (
            <div className="space-y-4">
              {schedulesQuery.data.map((schedule) => (
                <Card key={schedule.id} className="bg-purple-900/30 border border-purple-500/30 p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="text-lg font-semibold text-white">{schedule.name}</h4>
                      <p className="text-sm text-gray-400">{schedule.frequency.charAt(0).toUpperCase() + schedule.frequency.slice(1)} • Next: {schedule.nextSendAt ? new Date(schedule.nextSendAt).toLocaleDateString() : "N/A"}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          try {
                            await testSendMutation.mutateAsync({ scheduleId: schedule.id });
                            alert("Test report sent successfully");
                          } catch (error) {
                            alert("Failed to send test report");
                          }
                        }}
                      >
                        Test Send
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-400 border-red-500/30 hover:bg-red-900/20"
                        onClick={async () => {
                          if (confirm("Are you sure you want to delete this schedule?")) {
                            try {
                              await deleteScheduleMutation.mutateAsync({ scheduleId: schedule.id });
                              await schedulesQuery.refetch();
                            } catch (error) {
                              alert("Failed to delete schedule");
                            }
                          }
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                  <div className="text-sm text-gray-300">
                    <p>Recipients: {(schedule.recipientEmails as string[]).join(", ")}</p>
                    <p>Metrics: {(schedule.metrics as string[]).join(", ")}</p>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="bg-purple-900/30 border border-purple-500/30 p-6 text-center text-gray-400">
              No schedules yet. Create one to start receiving automated reports.
            </Card>
          )}
        </TabsContent>

        {/* Preference History Tab */}
        <TabsContent value="versions" className="space-y-4">
          {restoreMessage && (
            <Card className={`p-4 ${restoreMessage.type === 'success' ? 'bg-green-900/30 border-green-500/30' : 'bg-red-900/30 border-red-500/30'}`}>
              <p className={restoreMessage.type === 'success' ? 'text-green-400' : 'text-red-400'}>
                {restoreMessage.text}
              </p>
            </Card>
          )}
          
          <Card className="bg-purple-900/30 border border-purple-500/30 p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Preference Version History</h2>
            {versionsQuery.isLoading ? (
              <div className="text-gray-400">Loading version history...</div>
            ) : versionsQuery.data && versionsQuery.data.length > 0 ? (
              <div className="space-y-2">
                {versionsQuery.data.map((version) => (
                  <div key={version.id} className="bg-purple-800/30 border border-purple-500/20 p-4 rounded flex justify-between items-start">
                    <div className="flex-1">
                      <p className="text-white font-medium">Version {version.versionNumber}</p>
                      <p className="text-sm text-gray-400">{version.createdAt}</p>
                      {version.changeDescription && (
                        <p className="text-sm text-gray-300 mt-1">{version.changeDescription}</p>
                      )}
                      <p className="text-sm text-gray-400 mt-2">
                        Metrics: {version.metrics.join(", ")}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          try {
                            await restoreVersionMutation.mutateAsync({ versionId: version.id });
                          } catch (error) {
                            console.error("Failed to restore version", error);
                          }
                        }}
                      >
                        Restore
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-400 border-red-500/30 hover:bg-red-900/20"
                        onClick={async () => {
                          if (confirm("Delete this version?")) {
                            try {
                              await deleteVersionMutation.mutateAsync({ versionId: version.id });
                            } catch (error) {
                              console.error("Failed to delete version", error);
                            }
                          }
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Card className="bg-purple-900/30 border border-purple-500/30 p-6 text-center text-gray-400">
                No preference versions yet. Your preferences will be saved as you make changes.
              </Card>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
