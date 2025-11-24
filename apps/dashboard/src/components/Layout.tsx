import type { ReactNode } from 'react';
import type { User } from '../types/auth';

interface LayoutProps {
  children: ReactNode;
  user: User;
  onLogout: () => void;
}

export const Layout = ({ children, user, onLogout }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200 flex flex-col">
      {/* Header */}
      <header className="bg-gradient-to-r from-cyan-500 via-blue-500 to-blue-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold text-white tracking-wide">
                EUSUITE
              </span>
              <span className="px-2 py-1 rounded-md bg-white/20 text-white text-xs font-semibold tracking-wide">
                DASHBOARD
              </span>
            </div>

            {/* User menu */}
            <div className="flex items-center gap-4">
              <span className="text-white/90 text-sm">
                {user?.username || user?.email || 'Gebruiker'}
              </span>
              <button
                onClick={onLogout}
                className="bg-white/15 hover:bg-white/25 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
              >
                Uitloggen
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-4 mt-auto transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            © 2025 EUsuite Platform • Alle rechten voorbehouden
          </p>
        </div>
      </footer>
    </div>
  );
};
