import { useAuth } from "@/_core/hooks/useAuth";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";
import { Loader2 } from "lucide-react";

/**
 * Home page - Acts as a redirect router
 * - If authenticated: redirects to dashboard
 * - If not authenticated: redirects to login page
 */
export default function Home() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (loading) return; // Wait for auth check to complete

    if (isAuthenticated) {
      // Redirect authenticated users to dashboard
      navigate("/dashboard");
    } else {
      // Redirect unauthenticated users to login
      window.location.href = getLoginUrl();
    }
  }, [isAuthenticated, loading, navigate]);

  // Show loading state while determining auth status
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-950 to-purple-950">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400 mx-auto mb-4" />
        <p className="text-white/60">Loading Rentala...</p>
      </div>
    </div>
  );
}
