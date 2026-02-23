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
import { trpc } from "@/lib/trpc";

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
  const [selectedMetrics, setSelectedMetrics] = useState<ReportMetric[]>(["overall", "cleanliness", "maintenance", "communication", "responsiveness", "value", "surveys", "recommendations"]);
  const [showMetricSelector, setShowMetricSelector] = useState(false);

  // Fetch properties list for filtering
  const propertiesQuery = trpc.propertyAnalytics.getProperties.useQuery();
  const exportMutation = trpc.propertyAnalytics.exportSatisfactionReport.useMutation();

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
        <TabsList className="grid w-full grid-cols-5 bg-purple-900/50 border border-purple-500/30">
          <TabsTrigger value="vacancy">Vacancy Trends</TabsTrigger>
          <TabsTrigger value="income">Income Forecast</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance Costs</TabsTrigger>
          <TabsTrigger value="payments">Payment Behavior</TabsTrigger>
          <TabsTrigger value="satisfaction">Tenant Satisfaction</TabsTrigger>
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
                          setSelectedMetrics([...selectedMetrics, metric]);
                        } else {
                          setSelectedMetrics(selectedMetrics.filter((m) => m !== metric));
                        }
                      }}
                      className="w-4 h-4"
                    />
                    <span className="text-white">{METRIC_LABELS[metric]}</span>
                  </label>
                ))}
              </div>
              <div className="flex gap-2 mt-4">
                <Button size="sm" variant="outline" onClick={() => setSelectedMetrics(Object.keys(METRIC_LABELS) as ReportMetric[])}>
                  Select All
                </Button>
                <Button size="sm" variant="outline" onClick={() => setSelectedMetrics([])}>
                  Deselect All
                </Button>
              </div>
            </Card>
          )}

          <div className="flex justify-end gap-2 mb-4">
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
      </Tabs>

      {/* Property Performance */}
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
    </div>
  );
}
