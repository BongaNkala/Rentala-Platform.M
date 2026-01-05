import React, { useState } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { useLocation, useRoute } from 'wouter';
import { Bell, Search, LogOut, Menu, X } from 'lucide-react';

interface RentalaLayoutProps {
  children: React.ReactNode;
  pageTitle: string;
  pageSubtitle?: string;
}

export default function RentalaLayout({ children, pageTitle, pageSubtitle }: RentalaLayoutProps) {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [, setLocation] = useLocation();

  const navItems = [
    { icon: 'fas fa-chart-line', label: 'Dashboard', href: '/dashboard', badge: null },
    { icon: 'fas fa-building', label: 'Properties', href: '/properties', badge: null },
    { icon: 'fas fa-door-open', label: 'Units', href: '/units', badge: null },
    { icon: 'fas fa-users', label: 'Tenants', href: '/tenants', badge: null },
    { icon: 'fas fa-file-contract', label: 'Leases', href: '/leases', badge: null },
    { icon: 'fas fa-credit-card', label: 'Payments', href: '/payments', badge: null },
    { icon: 'fas fa-wrench', label: 'Maintenance', href: '/maintenance', badge: null },
    { icon: 'fas fa-clipboard-check', label: 'Inspections', href: '/inspections', badge: null },
  ];

  const handleLogout = async () => {
    await logout();
    setLocation('/');
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-blue-950 via-purple-950 to-blue-900">
      {/* Background overlay */}
      <div className="fixed inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-cyan-500/5 pointer-events-none" />
      
      {/* Background app name */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-0">
        <div className="text-9xl font-black text-white/3 select-none tracking-widest">
          Rentala
        </div>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen w-72 bg-white/8 backdrop-blur-2xl border-r border-white/20 z-50 transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0`}
      >
        {/* Sidebar Header */}
        <div className="p-8 border-b border-white/10">
          <div className="flex items-center gap-4 mb-5">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-xl font-bold shadow-lg">
              R
            </div>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
                Rentala
              </h2>
              <p className="text-xs text-white/60">Property Management</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-6 space-y-2 overflow-y-auto h-[calc(100vh-280px)]">
          {navItems.map((item) => (
            <button
              key={item.href}
              onClick={() => setLocation(item.href)}
              className="w-full flex items-center gap-4 px-5 py-3 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-all duration-300 group relative"
            >
              <i className={`${item.icon} text-lg w-6 text-center`} />
              <span className="font-medium text-sm">{item.label}</span>
              {item.badge && (
                <span className="ml-auto bg-blue-500 text-white text-xs px-2.5 py-1 rounded-full font-semibold">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* User Profile */}
        <div className="absolute bottom-8 left-6 right-6 p-5 bg-white/10 rounded-2xl border border-white/15 backdrop-blur-xl">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">{user?.name || 'User'}</h4>
              <p className="text-xs text-white/60">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg text-sm font-medium transition-colors"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 ml-0 md:ml-72">
        {/* Top Header */}
        <header className="sticky top-0 z-40 bg-white/5 backdrop-blur-xl border-b border-white/10">
          <div className="px-8 py-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="md:hidden p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
                  {pageTitle}
                </h1>
                {pageSubtitle && <p className="text-white/60 text-sm mt-1">{pageSubtitle}</p>}
              </div>
            </div>

            <div className="flex items-center gap-6">
              {/* Search */}
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={20} />
                <input
                  type="text"
                  placeholder="Search..."
                  className="pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:bg-white/15 focus:border-white/30 transition-all"
                />
              </div>

              {/* Notifications */}
              <button className="relative p-2 hover:bg-white/10 rounded-lg transition-colors">
                <Bell size={24} className="text-white/70" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-8 relative z-10">
          {children}
        </main>
      </div>
    </div>
  );
}
