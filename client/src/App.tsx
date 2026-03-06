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
 * BackgroundVideo Component - Universal 3D Video Background
 * 
 * Displays an animated 3D background video across all pages with:
 * - Lazy loading for performance
 * - Responsive video sizing (cover)
 * - Dark overlay for text readability
 * - Smooth fade-in animation
 * - Fallback to gradient if video fails
 */
function BackgroundVideo() {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [sessionId] = useState(() => generateSessionId());
  const { user } = useAuth();
  const trackMutation = trpc.videoAnalytics.track.useMutation();

  // Track background video load
  useEffect(() => {
    (async () => {
      try {
        const deviceInfo = await getDeviceInfo();
        trackMutation.mutate({
          sessionId,
          userId: user?.id || null,
          format: 'video',
          browserName: deviceInfo.browserName,
          browserVersion: deviceInfo.browserVersion,
          osName: deviceInfo.osName,
          osVersion: deviceInfo.osVersion,
          deviceType: deviceInfo.deviceType,
          screenResolution: deviceInfo.screenResolution,
          connectionSpeed: deviceInfo.connectionSpeed,
          pageUrl: window.location.href,
          referrer: document.referrer,
        });
      } catch (error) {
        console.error('Failed to track background video:', error);
      }
    })();
  }, [sessionId, user?.id, trackMutation]);

  // Lazy loading with Intersection Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsLoaded(true);
            // Start playing video when visible
            if (videoRef.current) {
              videoRef.current.play().catch(() => {
                console.warn('Video autoplay failed');
              });
            }
          }
        });
      },
      {
        threshold: 0.1,
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, []);

  return (
    <>
      <div
        ref={containerRef}
        className="fixed inset-0 bg-gradient-to-br from-blue-950 to-purple-950 -z-10 overflow-hidden"
      >
        {isLoaded && (
          <video
            ref={videoRef}
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
            style={{
              opacity: 1,
              transition: 'opacity 0.8s ease-in-out',
            }}
            onLoadedData={() => {
              if (videoRef.current) {
                videoRef.current.style.opacity = '1';
              }
            }}
          >
            <source
              src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663152451982/fzKpDTPHFVkmanzC.mp4"
              type="video/mp4"
            />
          </video>
        )}
      </div>
      {/* Dark overlay for text readability */}
      <div className="fixed inset-0 bg-black/40 -z-10" style={{ opacity: isLoaded ? 1 : 0 }} />
    </>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <BackgroundVideo />
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
            <Route component={NotFound} />
          </Switch>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
