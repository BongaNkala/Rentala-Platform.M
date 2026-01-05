import React from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation, useRoute } from "wouter";
import RentalaLayout from "./RentalaLayout";
import TenantPortal from "../pages/TenantPortal";

export type UserRole = "super_admin" | "agency_admin" | "landlord" | "staff" | "tenant";

interface RoleBasedLayoutProps {
  children: React.ReactNode;
}

/**
 * RoleBasedLayout wrapper that renders different layouts based on user role
 * - Landlords: Full dashboard with financial controls
 * - Staff: Maintenance and tenant management focused
 * - Tenants: Portal view with lease and payment info
 */
export default function RoleBasedLayout({ children }: RoleBasedLayoutProps) {
  const { user, loading } = useAuth();
  const [location] = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin">
          <div className="h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Not Authenticated</h1>
          <p className="text-gray-600">Please log in to continue</p>
        </div>
      </div>
    );
  }

  // Tenant portal has its own layout
  if (user.role === "tenant") {
    return <TenantPortal />;
  }

  // Landlord, Agency Admin, and Staff use the main RentalaLayout
  if (["landlord", "agency_admin", "staff", "super_admin"].includes(user.role)) {
    return (
      <RentalaLayout pageTitle="Dashboard" pageSubtitle="Property Management System">
        {children}
      </RentalaLayout>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Invalid Role</h1>
        <p className="text-gray-600">Your user role is not recognized</p>
      </div>
    </div>
  );
}

/**
 * Hook to check if user has a specific role
 */
export function useHasRole(roles: UserRole | UserRole[]): boolean {
  const { user } = useAuth();
  if (!user) return false;

  const roleArray = Array.isArray(roles) ? roles : [roles];
  return roleArray.includes(user.role as UserRole);
}

/**
 * Hook to check if user can access a feature
 */
export function useCanAccess(feature: string): boolean {
  const { user } = useAuth();
  if (!user) return false;

  const rolePermissions: Record<UserRole, string[]> = {
    super_admin: [
      "properties",
      "units",
      "tenants",
      "leases",
      "payments",
      "maintenance",
      "inspections",
      "accounting",
      "reports",
      "staff_management",
      "agency_management",
    ],
    agency_admin: [
      "properties",
      "units",
      "tenants",
      "leases",
      "payments",
      "maintenance",
      "inspections",
      "accounting",
      "reports",
      "staff_management",
    ],
    landlord: [
      "properties",
      "units",
      "tenants",
      "leases",
      "payments",
      "maintenance",
      "inspections",
      "accounting",
      "reports",
    ],
    staff: ["properties", "units", "tenants", "leases", "maintenance", "inspections"],
    tenant: ["lease", "payments", "maintenance_requests", "messages"],
  };

  const userRole = user.role as UserRole;
  return rolePermissions[userRole]?.includes(feature) || false;
}

/**
 * Component to conditionally render based on role
 */
interface RoleGuardProps {
  roles: UserRole | UserRole[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function RoleGuard({ roles, children, fallback }: RoleGuardProps) {
  const hasRole = useHasRole(roles);

  if (!hasRole) {
    return fallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
}
