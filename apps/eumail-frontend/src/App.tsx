import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { Layout } from './components/Layout';
import { Inbox } from './pages/Inbox';
import { ReadMessage } from './pages/ReadMessage';
import { Compose } from './pages/Compose';
import { Sent } from './pages/Sent';

function App() {
  const { user, loading } = useAuth();

  // Loading state with purple mail theme
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-800 via-purple-700 to-purple-900">
        <img src="/eusuite-logo.png" alt="EUSuite" className="h-16 mb-4" />
        <div className="text-purple-200 text-3xl font-bold mb-6 tracking-wider">EUMAIL</div>
        <div className="w-12 h-12 border-4 border-purple-300/30 border-t-purple-300 rounded-full animate-spin"></div>
        <p className="mt-4 text-white/90">Authenticatie valideren...</p>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-800 via-purple-700 to-purple-900">
        <p className="text-white/90">Doorsturen naar login portaal...</p>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Layout user={user}>
        <Routes>
          <Route path="/mail" element={<Inbox />} />
          <Route path="/mail/read/:id" element={<ReadMessage />} />
          <Route path="/mail/new" element={<Compose />} />
          <Route path="/mail/sent" element={<Sent />} />
          <Route path="/" element={<Navigate to="/mail" replace />} />
          <Route path="*" element={<Navigate to="/mail" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
