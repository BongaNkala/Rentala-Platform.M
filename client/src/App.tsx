import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
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

function BackgroundVideo() {
  return (
    <>
      <div className="video-background">
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          style={{
            WebkitBackfaceVisibility: 'hidden',
            backfaceVisibility: 'hidden',
          }}
        >
          <source src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663152451982/vOqdkDMXyWIwzDxn.mp4" type="video/mp4" />
        </video>
      </div>
      <div className="video-overlay" />
    </>
  );
}

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/dashboard"} component={() => <ProtectedRoute component={RoleAwareDashboard} />} />
      <Route path={"/properties"} component={() => <ProtectedRoute component={Properties} />} />
      <Route path={"/units"} component={() => <ProtectedRoute component={Units} />} />
      <Route path={"/tenants"} component={() => <ProtectedRoute component={Tenants} />} />
      <Route path={"/leases"} component={() => <ProtectedRoute component={Leases} />} />
      <Route path={"/payments"} component={() => <ProtectedRoute component={Payments} />} />
      <Route path={"/maintenance"} component={() => <ProtectedRoute component={Maintenance} />} />
      <Route path={"/inspections"} component={() => <ProtectedRoute component={Inspections} />} />
      <Route path={"/accounting"} component={() => <ProtectedRoute component={Accounting} />} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <BackgroundVideo />
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
