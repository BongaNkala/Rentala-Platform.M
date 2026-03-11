import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import { useEffect, useRef, useState } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Properties from "./pages/Properties";
import Units from "./pages/Units";
import Tenants from "./pages/Tenants";
import Leases from "./pages/Leases";
import Payments from "./pages/Payments";
import Maintenance from "./pages/Maintenance";
import Inspections from "./pages/Inspections";
import Accounting from "./pages/Accounting";
import RoleAwareDashboard from "./pages/RoleAwareDashboard";
import RoleBasedLayout from "./components/RoleBasedLayout";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "./lib/trpc";
import { getDeviceInfo, generateSessionId } from "./lib/deviceDetection";
import VideoAnalytics from "./pages/VideoAnalytics";
import Analytics from "./pages/Analytics";
import PropertiesManagement from "./pages/PropertiesManagement";
import TenantsManagement from "./pages/TenantsManagement";
import LeaseManagement from "./pages/LeaseManagement";
import PaymentTracking from "./pages/PaymentTracking";
import LeaseRenewal from "./pages/LeaseRenewal";
import DocumentManagement from "./pages/DocumentManagement";
import MaintenanceWorkflow from "./pages/MaintenanceWorkflow";
import TenantCommunication from "./pages/TenantCommunication";
import AnalyticsReporting from "./pages/AnalyticsReporting";
import NotificationPreferences from "./pages/NotificationPreferences";
import TenantPaymentPortal from "./pages/TenantPaymentPortal";
import SMSPreferences from "./pages/SMSPreferences";
import BulkSMSCampaigns from "./pages/BulkSMSCampaigns";
import SMSTemplates from "./pages/SMSTemplates";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-950 to-purple-950">
        <div className="text-center">
          <div className="inline-block animate-spin mb-4">
            <div className="w-8 h-8 border-4 border-white/20 border-t-blue-500 rounded-full" />
          </div>
          <p className="text-white/60">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <NotFound />;
  }

  return (
    <RoleBasedLayout>
      <Component />
    </RoleBasedLayout>
  );
}

/**
 * BackgroundImage Component - Universal Rentala Background
 * 
 * Displays the Rentala background image across all pages with:
 * - Fixed positioning for consistent appearance
 * - Responsive sizing (cover)
 * - Dark overlay for text readability
 * - Optimized performance
 */
function BackgroundImage() {
  return (
    <>
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <img
          src="https://d2xsxph8kpxj0f.cloudfront.net/310519663152451982/XXbomGLTy2orzwdwCGpX97/rentala_web_background_balanced_21fb893d.png"
          alt="Rentala Background"
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            opacity: 1,
            transition: 'opacity 0.8s ease-in-out',
          }}
        />
      </div>
      {/* Subtle overlay for text readability */}
      <div className="fixed inset-0 bg-black/15 -z-10" />
    </>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <BackgroundImage />
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/dashboard" component={() => <ProtectedRoute component={Dashboard} />} />
            <Route path="/properties" component={() => <ProtectedRoute component={Properties} />} />
            <Route path="/units" component={() => <ProtectedRoute component={Units} />} />
            <Route path="/tenants" component={() => <ProtectedRoute component={Tenants} />} />
            <Route path="/leases" component={() => <ProtectedRoute component={Leases} />} />
            <Route path="/payments" component={() => <ProtectedRoute component={Payments} />} />
            <Route path="/maintenance" component={() => <ProtectedRoute component={Maintenance} />} />
            <Route path="/inspections" component={() => <ProtectedRoute component={Inspections} />} />
            <Route path="/accounting" component={() => <ProtectedRoute component={Accounting} />} />
            <Route path="/role-dashboard" component={() => <ProtectedRoute component={RoleAwareDashboard} />} />
            <Route path="/video-analytics" component={() => <ProtectedRoute component={VideoAnalytics} />} />
            <Route path="/analytics" component={() => <ProtectedRoute component={Analytics} />} />
            <Route path="/properties-management" component={() => <ProtectedRoute component={PropertiesManagement} />} />
            <Route path="/tenants-management" component={() => <ProtectedRoute component={TenantsManagement} />} />
            <Route path="/leases-management" component={() => <ProtectedRoute component={LeaseManagement} />} />
            <Route path="/payment-tracking" component={() => <ProtectedRoute component={PaymentTracking} />} />
            <Route path="/lease-renewal" component={() => <ProtectedRoute component={LeaseRenewal} />} />
            <Route path="/documents" component={() => <ProtectedRoute component={DocumentManagement} />} />
            <Route path="/maintenance-workflow" component={() => <ProtectedRoute component={MaintenanceWorkflow} />} />
            <Route path="/tenant-communication" component={() => <ProtectedRoute component={TenantCommunication} />} />
            <Route path="/analytics-reporting" component={() => <ProtectedRoute component={AnalyticsReporting} />} />
            <Route path="/notification-preferences" component={() => <ProtectedRoute component={NotificationPreferences} />} />
            <Route path="/tenant-payments" component={() => <ProtectedRoute component={TenantPaymentPortal} />} />
            <Route path="/sms-preferences" component={() => <ProtectedRoute component={SMSPreferences} />} />
            <Route path="/bulk-sms-campaigns" component={() => <ProtectedRoute component={BulkSMSCampaigns} />} />
            <Route path="/sms-templates" component={() => <ProtectedRoute component={SMSTemplates} />} />
            <Route component={NotFound} />
          </Switch>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
