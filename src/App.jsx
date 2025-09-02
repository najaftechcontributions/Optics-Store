import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { StoreProvider, useStore } from './contexts/StoreContext';
import Layout from './components/Layout';
import StoreLogin from './components/StoreLogin';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import Checkups from './pages/Checkups';
import Orders from './pages/Orders';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import { initDatabase } from './utils/database';

function AppContent() {
  const { isAuthenticated, isSuperAdmin, loading } = useStore();

  useEffect(() => {
    const init = async () => {
      try {
        await initDatabase();
      } catch (error) {
        console.error('Failed to initialize database:', error);
      }
    };
    init();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated && !isSuperAdmin) {
    return <StoreLogin />;
  }

  return (
    <Layout>
      <Routes>
        {/* Default route based on user type */}
        <Route path="/" element={isSuperAdmin ? <Settings /> : <Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/checkups" element={<Checkups />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/reports" element={<Reports />} />
        {/* Settings only accessible to super admin */}
        <Route path="/settings" element={isSuperAdmin ? <Settings /> : <Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
  );
}

function App() {
  return (
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  );
}

export default App;
