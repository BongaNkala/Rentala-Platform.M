import { Toaster } from "@/components/ui/sonner";
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
 * BackgroundVideo Component with Multi-Format Support & Analytics
 * 
 * Supports multiple video formats with fallback:
 * 1. VP9/WebM (best compression, ~535KB)
 * 2. HEVC/H.265 (good compression, ~390KB)
 * 3. H.264/MP4 (universal fallback, ~1.6MB)
 * 
 * Uses Intersection Observer for lazy loading to improve initial page load.
 * Video only loads when visible (10% threshold).
 * 
 * Tracks video format usage, load times, and device information for analytics.
 */
function BackgroundVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [shouldPlay, setShouldPlay] = useState(false);
  const [supportedFormat, setSupportedFormat] = useState<'webm' | 'hevc' | 'mp4'>('mp4');
  const [sessionId] = useState(() => generateSessionId());
  const { user } = useAuth();
  const trackMutation = trpc.videoAnalytics.track.useMutation();
  const videoStartTimeRef = useRef<number>(0);

  // Detect supported video formats and track analytics
  useEffect(() => {
    const video = document.createElement('video');
    let detectedFormat: 'webm' | 'hevc' | 'mp4' = 'mp4';
    
    // Check VP9/WebM support (most efficient)
    if (video.canPlayType('video/webm; codecs="vp9"')) {
      detectedFormat = 'webm';
    }
    // Check HEVC/H.265 support (good fallback)
    else if (video.canPlayType('video/mp4; codecs="hev1"') || video.canPlayType('video/mp4; codecs="hvc1"')) {
      detectedFormat = 'hevc';
    }
    
    setSupportedFormat(detectedFormat);
    
    // Track analytics asynchronously
    (async () => {
      try {
        const deviceInfo = await getDeviceInfo();
        trackMutation.mutate({
          sessionId,
          userId: user?.id || null,
          format: detectedFormat,
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
        console.error('Failed to track video format:', error);
      }
    })();
  }, [sessionId, user?.id, trackMutation]);

  // Lazy loading with Intersection Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setShouldPlay(true);
            setIsLoaded(true);
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

  // Handle video playback and track load time
  useEffect(() => {
    if (videoRef.current) {
      if (shouldPlay) {
        videoStartTimeRef.current = performance.now();
        videoRef.current.play().catch(() => {
          console.log('Video autoplay blocked by browser');
        });
      } else {
        videoRef.current.pause();
      }
    }
  }, [shouldPlay]);

  // Track video load time
  const handleVideoLoadedData = () => {
    if (videoStartTimeRef.current > 0) {
      const loadTime = Math.round(performance.now() - videoStartTimeRef.current);
      trackMutation.mutate({
        sessionId,
        userId: user?.id || null,
        format: supportedFormat,
        loadTime,
      });
    }
  };

  // Get video sources based on supported format
  const getVideoSources = () => {
    const sources = [];

    // Always include WebM/VP9 first (best compression)
    sources.push({
      src: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663152451982/exKiSHPdGqVrkDVG.webm',
      type: 'video/webm; codecs="vp9"',
      format: 'webm' as const,
    });

    // Include HEVC as fallback (good compression)
    sources.push({
      src: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663152451982/ugmoimFwgmjDksIj.mp4',
      type: 'video/mp4; codecs="hev1"',
      format: 'hevc' as const,
    });

    // Include H.264/MP4 as universal fallback
    sources.push({
      src: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663152451982/vOqdkDMXyWIwzDxn.mp4',
      type: 'video/mp4; codecs="avc1"',
      format: 'mp4' as const,
    });

    return sources;
  };

  return (
    <>
      <div ref={containerRef} className="video-background">
        <video
          ref={videoRef}
          muted
          loop
          playsInline
          preload={isLoaded ? "auto" : "none"}
          onLoadedData={handleVideoLoadedData}
          style={{
            WebkitBackfaceVisibility: 'hidden',
            backfaceVisibility: 'hidden',
            opacity: isLoaded ? 1 : 0,
            transition: 'opacity 0.5s ease-in-out',
          }}
        >
          {getVideoSources().map((source) => (
            <source key={source.format} src={source.src} type={source.type} />
          ))}
          Your browser does not support the video tag. Please use a modern browser to view this content.
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
      <Route path={"/video-analytics"} component={() => <ProtectedRoute component={VideoAnalytics} />} />
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
