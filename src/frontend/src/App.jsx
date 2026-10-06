import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { AdminSocPage } from './pages/AdminSocPage';
import { TransactionTable } from './components/TransactionTable';
import { BudgetTracker } from './components/BudgetTracker';
import { ProfileSettings } from './components/ProfileSettings';
import { AnomalyConfirmationModal } from './components/AnomalyConfirmationModal';
import { AddTransactionModal } from './components/AddTransactionModal';
import { transactionApi } from './utils/api';
import { useAuth } from './context/AuthContext';
import { CheckCircle2, ShieldAlert } from 'lucide-react';

// Protected Route Guard
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const token = localStorage.getItem('finsec_access_token');

  if (loading && !token) {
    return (
      <div className="min-h-screen bg-[#eef2f6] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // If token is missing, redirect to login
  if (!user && !token) {
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
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [filters, setFilters] = useState({});
  const [alertCount, setAlertCount] = useState(1);
  const [suspiciousTxAlert, setSuspiciousTxAlert] = useState(null);
  const [toast, setToast] = useState(null);

  // Modals state
  const [addTxModalOpen, setAddTxModalOpen] = useState(false);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

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

  // Fetch summary and transactions from backend if available
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
      console.warn('Backend not responding, using rich fallback mock state.');
    } finally {
      setLoadingTransactions(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filters]);

  return (
    <>
      {/* Global Toast Notification */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 animate-in slide-in-from-top-3 duration-200">
          <div
            className={`flex items-center space-x-2.5 px-4 py-3 rounded-2xl shadow-xl border text-xs font-bold ${
              toast.type === 'danger'
                ? 'bg-rose-600 text-white border-rose-500 shadow-rose-600/30'
                : 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-600/30'
            }`}
          >
            {toast.type === 'danger' ? (
              <ShieldAlert className="w-4 h-4 text-white" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-white" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      <Routes>
        {/* Route 1: Default Root -> Redirect to /login */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Route 2: Login Page */}
        <Route path="/login" element={<LoginPage />} />

        {/* Route 3: User Dashboard (/dashboard) */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardShell alertCount={alertCount}>
                <DashboardPage
                  transactions={transactions}
                  summary={summary}
                  onRefresh={loadData}
                  onTriggerAnomaly={(mockAlert) => setSuspiciousTxAlert(mockAlert)}
                />
              </DashboardShell>
            </ProtectedRoute>
          }
        />

        {/* Route 4: Admin SOC Dashboard (/admin) */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <DashboardShell alertCount={alertCount}>
                <AdminSocPage />
              </DashboardShell>
            </ProtectedRoute>
          }
        />

        {/* Route 5: Protected Wallet (/wallet) */}
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

        {/* Route 6: Protected Transactions (/transactions) */}
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

        {/* Route 7: Protected Settings (/settings) */}
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
          showToast={showToast}
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
