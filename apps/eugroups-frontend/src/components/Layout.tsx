import { Outlet, Link, useLocation } from 'react-router-dom';
import { Users, Home } from 'lucide-react';

export default function Layout() {
  const location = useLocation();
  const dashboardUrl = import.meta.env.VITE_DASHBOARD_URL || 'http://192.168.124.50:30080';

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gradient-to-b from-primary-600 to-primary-700 text-white flex flex-col">
        {/* Logo */}
        <div className="p-4 border-b border-primary-500">
          <Link to="/groups" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <span className="text-xl font-bold">EUGroups</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          <Link
            to="/groups"
            className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
              location.pathname === '/groups'
                ? 'bg-white/20 text-white'
                : 'hover:bg-white/10 text-white/80'
            }`}
          >
            <Users className="w-5 h-5" />
            <span>My Groups</span>
          </Link>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-primary-500 space-y-2">
          <a
            href={dashboardUrl}
            className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-white/10 text-white/80 transition-colors"
          >
            <Home className="w-5 h-5" />
            <span>Dashboard</span>
          </a>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
