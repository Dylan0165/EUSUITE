import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Mail, Send, PenSquare, Home, Inbox } from 'lucide-react';
import { DASHBOARD_URL } from '../config/constants';

interface User {
  user_id: string;
  email: string;
  username?: string;
}

interface LayoutProps {
  children: ReactNode;
  user: User;
}

export function Layout({ children, user }: LayoutProps) {
  const location = useLocation();

  const navItems = [
    { path: '/mail', label: 'Inbox', icon: Inbox },
    { path: '/mail/sent', label: 'Verzonden', icon: Send },
    { path: '/mail/new', label: 'Nieuw', icon: PenSquare },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-purple-800 via-purple-700 to-purple-800 shadow-lg">
        <div className="px-4 lg:px-6">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center gap-4">
              <img src="/eusuite-logo.png" alt="EUSuite" className="h-10" />
              <div className="flex items-center gap-2">
                <Mail className="h-6 w-6 text-purple-200" />
                <span className="text-2xl font-bold text-white tracking-wider">
                  EUMAIL
                </span>
                <span className="ml-2 px-2 py-0.5 rounded bg-purple-600/50 text-purple-200 text-xs font-semibold border border-purple-500/30">
                  MAIL
                </span>
              </div>
            </div>

            {/* User & Dashboard Link */}
            <div className="flex items-center gap-4">
              <a
                href={DASHBOARD_URL}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-all"
              >
                <Home size={18} />
                <span>Dashboard</span>
              </a>
              <span className="text-purple-200 text-sm">
                {user.username || user.email}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 p-4">
          <Link
            to="/mail/new"
            className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold mb-6 transition-colors"
          >
            <PenSquare size={20} />
            Nieuwe Mail
          </Link>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-purple-100 text-purple-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <item.icon size={20} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Page Content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
