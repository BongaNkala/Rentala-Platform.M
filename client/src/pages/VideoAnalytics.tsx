import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const COLORS = ["#4361ee", "#7209b7", "#4cc9f0"];

export default function VideoAnalytics() {
  const [days, setDays] = useState(30);
  
  // Fetch analytics data
  const summaryQuery = trpc.videoAnalytics.getSummary.useQuery({ days });
  const formatStatsQuery = trpc.videoAnalytics.getFormatStats.useQuery({ days });
  const deviceStatsQuery = trpc.videoAnalytics.getDeviceTypeStats.useQuery({ days });
  const browserStatsQuery = trpc.videoAnalytics.getBrowserStats.useQuery({ days });
  const osStatsQuery = trpc.videoAnalytics.getOSStats.useQuery({ days });
  const connectionStatsQuery = trpc.videoAnalytics.getConnectionSpeedStats.useQuery({ days });
  const timeSeriesQuery = trpc.videoAnalytics.getFormatTimeSeriesStats.useQuery({ days });

  const summary = summaryQuery.data;
  const formatStats = formatStatsQuery.data || [];
  const deviceStats = deviceStatsQuery.data || [];
  const browserStats = browserStatsQuery.data || [];
  const osStats = osStatsQuery.data || [];
  const connectionStats = connectionStatsQuery.data || [];
  const timeSeries = timeSeriesQuery.data || [];

  // Transform data for charts
  const formatChartData = formatStats.map((stat: any) => ({
    name: stat.format.toUpperCase(),
    count: stat.count,
    avgLoadTime: stat.avgLoadTime || 0,
  }));

  const deviceChartData = deviceStats.reduce((acc: any[], stat: any) => {
    const existing = acc.find((item) => item.name === stat.deviceType);
    if (existing) {
      existing[stat.format] = stat.count;
    } else {
      acc.push({
        name: stat.deviceType,
        webm: stat.format === "webm" ? stat.count : 0,
        hevc: stat.format === "hevc" ? stat.count : 0,
        mp4: stat.format === "mp4" ? stat.count : 0,
      });
    }
    return acc;
  }, []);

  const browserChartData = browserStats.reduce((acc: any[], stat: any) => {
    const existing = acc.find((item) => item.name === stat.browserName);
    if (existing) {
      existing.count += stat.count;
    } else {
      acc.push({
        name: stat.browserName || "Unknown",
        count: stat.count,
      });
    }
    return acc;
  }, []);

  const osChartData = osStats.reduce((acc: any[], stat: any) => {
    const existing = acc.find((item) => item.name === stat.osName);
    if (existing) {
      existing.count += stat.count;
    } else {
      acc.push({
        name: stat.osName || "Unknown",
        count: stat.count,
      });
    }
    return acc;
  }, []);

  const connectionChartData = connectionStats.map((stat: any) => ({
    name: stat.connectionSpeed || "Unknown",
    count: stat.count,
    avgLoadTime: stat.avgLoadTime || 0,
  }));

  const timeSeriesChartData = timeSeries.reduce((acc: any[], stat: any) => {
    const existing = acc.find((item) => item.date === stat.date);
    if (existing) {
      existing[stat.format] = stat.count;
    } else {
      acc.push({
        date: stat.date,
        webm: stat.format === "webm" ? stat.count : 0,
        hevc: stat.format === "hevc" ? stat.count : 0,
        mp4: stat.format === "mp4" ? stat.count : 0,
      });
    }
    return acc;
  }, []);

  const isLoading = summaryQuery.isLoading || formatStatsQuery.isLoading;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Video Analytics</h1>
          <p className="text-gray-600">Track video format usage and device compatibility across your platform</p>
        </div>

        {/* Date Range Selector */}
        <div className="mb-6 flex gap-2">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                days === d
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
              }`}
            >
              Last {d} Days
            </button>
          ))}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{summary?.totalEvents || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">WebM (VP9)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                {formatStats.find((s: any) => s.format === "webm")?.count || 0}
              </div>
              <p className="text-xs text-gray-500 mt-1">Best compression</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">HEVC (H.265)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">
                {formatStats.find((s: any) => s.format === "hevc")?.count || 0}
              </div>
              <p className="text-xs text-gray-500 mt-1">Good compression</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">H.264 (MP4)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-cyan-600">
                {formatStats.find((s: any) => s.format === "mp4")?.count || 0}
              </div>
              <p className="text-xs text-gray-500 mt-1">Universal fallback</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <Tabs defaultValue="format" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="format">Format Usage</TabsTrigger>
            <TabsTrigger value="device">Device Type</TabsTrigger>
            <TabsTrigger value="browser">Browser</TabsTrigger>
            <TabsTrigger value="os">Operating System</TabsTrigger>
            <TabsTrigger value="connection">Connection Speed</TabsTrigger>
          </TabsList>

          {/* Format Usage */}
          <TabsContent value="format">
            <Card>
              <CardHeader>
                <CardTitle>Video Format Distribution</CardTitle>
                <CardDescription>Usage count by video format</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="h-80 flex items-center justify-center text-gray-500">Loading...</div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={formatChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, count }) => `${name}: ${count}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {formatChartData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Average Load Time by Format</CardTitle>
                <CardDescription>Time in milliseconds</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="h-80 flex items-center justify-center text-gray-500">Loading...</div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={formatChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="avgLoadTime" fill="#4361ee" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Device Type */}
          <TabsContent value="device">
            <Card>
              <CardHeader>
                <CardTitle>Format Usage by Device Type</CardTitle>
                <CardDescription>Breakdown by desktop, tablet, and mobile</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="h-80 flex items-center justify-center text-gray-500">Loading...</div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={deviceChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="webm" fill="#4361ee" />
                      <Bar dataKey="hevc" fill="#7209b7" />
                      <Bar dataKey="mp4" fill="#4cc9f0" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Browser */}
          <TabsContent value="browser">
            <Card>
              <CardHeader>
                <CardTitle>Format Usage by Browser</CardTitle>
                <CardDescription>Top browsers using your video</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="h-80 flex items-center justify-center text-gray-500">Loading...</div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={browserChartData.slice(0, 10)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#4361ee" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* OS */}
          <TabsContent value="os">
            <Card>
              <CardHeader>
                <CardTitle>Format Usage by Operating System</CardTitle>
                <CardDescription>Top operating systems</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="h-80 flex items-center justify-center text-gray-500">Loading...</div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={osChartData.slice(0, 10)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#7209b7" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Connection Speed */}
          <TabsContent value="connection">
            <Card>
              <CardHeader>
                <CardTitle>Format Usage by Connection Speed</CardTitle>
                <CardDescription>Video format preference by network speed</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="h-80 flex items-center justify-center text-gray-500">Loading...</div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={connectionChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#4cc9f0" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Average Load Time by Connection Speed</CardTitle>
                <CardDescription>Time in milliseconds</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="h-80 flex items-center justify-center text-gray-500">Loading...</div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={connectionChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="avgLoadTime" fill="#4361ee" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Time Series */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Format Usage Over Time</CardTitle>
            <CardDescription>Daily video format distribution</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-80 flex items-center justify-center text-gray-500">Loading...</div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={timeSeriesChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="webm" stroke="#4361ee" />
                  <Line type="monotone" dataKey="hevc" stroke="#7209b7" />
                  <Line type="monotone" dataKey="mp4" stroke="#4cc9f0" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
