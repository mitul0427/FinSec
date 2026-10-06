import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { SocThreatMap } from './components/SocThreatMap';
import { TransactionTable } from './components/TransactionTable';
import { BudgetTracker } from './components/BudgetTracker';
import { ProfileSettings } from './components/ProfileSettings';
import { AnomalyConfirmationModal } from './components/AnomalyConfirmationModal';
import { AddTransactionModal } from './components/AddTransactionModal';
import { transactionApi } from './utils/api';
import { useAuth } from './context/AuthContext';

// Protected Route Guard
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-[#eef2f6] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Main Authenticated Dashboard Shell Layout
const DashboardShell = ({ children, alertCount }) => {
  return (
    <div className="min-h-screen bg-[#eef2f6] flex">
      {/* Left Sidebar */}
      <Sidebar />

      {/* Main Right Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar alertCount={alertCount} />
        <main className="flex-1 p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export function App() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loadingTransactions, setLoadingTransactions] = useState(true);
  const [filters, setFilters] = useState({});
  const [alertCount, setAlertCount] = useState(0);
  const [suspiciousTxAlert, setSuspiciousTxAlert] = useState(null);

  // Modals state
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [addTxModalOpen, setAddTxModalOpen] = useState(false);

  // Real-time socket listener for bank anomalies & security alerts
  useEffect(() => {
    const socket = io('/', {
      transports: ['websocket', 'polling']
    });

    if (user?.id) {
      socket.emit('join_user', user.id);
    }

    socket.on('suspicious_transaction', (data) => {
      console.log('[Bank Anomaly Alert Received]:', data);
      setSuspiciousTxAlert(data);
      setAlertCount((prev) => prev + 1);
    });

    socket.on('security_alert', (secAlert) => {
      setAlertCount((prev) => prev + 1);
    });

    return () => socket.disconnect();
  }, [user]);

  // Fetch summary and transactions
  const loadData = async () => {
    try {
      const sumRes = await transactionApi.summary();
      if (sumRes.ok) {
        const sumData = await sumRes.json();
        setSummary(sumData);
      }

      setLoadingTransactions(true);
      const queryParams = new URLSearchParams();
      if (filters.search) queryParams.append('search', filters.search);
      if (filters.category) queryParams.append('category', filters.category);
      if (filters.type) queryParams.append('type', filters.type);

      const qs = queryParams.toString() ? `?${queryParams.toString()}` : '';
      const txRes = await transactionApi.list(qs);
      if (txRes.ok) {
        const txData = await txRes.json();
        setTransactions(txData.transactions || []);
      }
    } catch (e) {
      console.error('Failed to load transaction data:', e);
    } finally {
      setLoadingTransactions(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [filters, user]);

  return (
    <>
      <Routes>
        {/* Route 1: Default Root -> Redirect to /login */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Route 2: Login Page */}
        <Route path="/login" element={<LoginPage />} />

        {/* Route 3: Protected Dashboard */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardShell alertCount={alertCount}>
                <DashboardPage
                  transactions={transactions}
                  summary={summary}
                  onRefresh={loadData}
                />
              </DashboardShell>
            </ProtectedRoute>
          }
        />

        {/* Route 4: Protected Wallet */}
        <Route
          path="/wallet"
          element={
            <ProtectedRoute>
              <DashboardShell alertCount={alertCount}>
                <div className="space-y-6">
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">Wallet & Budget Management</h2>
                  <BudgetTracker />
                </div>
              </DashboardShell>
            </ProtectedRoute>
          }
        />

        {/* Route 5: Protected Transactions */}
        <Route
          path="/transactions"
          element={
            <ProtectedRoute>
              <DashboardShell alertCount={alertCount}>
                <div className="space-y-6">
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">Encrypted Financial Ledger</h2>
                  <TransactionTable
                    transactions={transactions}
                    loading={loadingTransactions}
                    filters={filters}
                    setFilters={setFilters}
                    onRefresh={loadData}
                    onOpenAddModal={() => setAddTxModalOpen(true)}
                  />
                </div>
              </DashboardShell>
            </ProtectedRoute>
          }
        />

        {/* Route 6: Protected SOC Threat Map */}
        <Route
          path="/soc"
          element={
            <ProtectedRoute>
              <DashboardShell alertCount={alertCount}>
                <div className="space-y-6">
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">SOC Threat Map & Live Ingress Defense</h2>
                  <SocThreatMap />
                </div>
              </DashboardShell>
            </ProtectedRoute>
          }
        />

        {/* Route 7: Protected Settings */}
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <DashboardShell alertCount={alertCount}>
                <ProfileSettings isOpen={true} onClose={() => {}} />
              </DashboardShell>
            </ProtectedRoute>
          }
        />

        {/* Fallback Route */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>

      {/* Global Suspicious Bank Anomaly Confirmation Modal */}
      {suspiciousTxAlert && (
        <AnomalyConfirmationModal
          alertData={suspiciousTxAlert}
          onClose={() => setSuspiciousTxAlert(null)}
          onActionResolved={loadData}
        />
      )}

      {/* Add Transaction Modal */}
      <AddTransactionModal
        isOpen={addTxModalOpen}
        onClose={() => setAddTxModalOpen(false)}
        onSuccess={loadData}
      />
    </>
  );
}

export default App;
