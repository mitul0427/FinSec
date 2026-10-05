import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { MetricCards } from './components/MetricCards';
import { ExpenseCharts } from './components/ExpenseCharts';
import { TransactionTable } from './components/TransactionTable';
import { BudgetTracker } from './components/BudgetTracker';
import { ReceiptScanner } from './components/ReceiptScanner';
import { AiAssistantWidget } from './components/AiAssistantWidget';
import { SocThreatMap } from './components/SocThreatMap';
import { AdminAuditLogs } from './components/AdminAuditLogs';
import { AuthModal } from './components/AuthModal';
import { PasskeyEnrollment } from './components/PasskeyEnrollment';
import { ProfileSettings } from './components/ProfileSettings';
import { AddTransactionModal } from './components/AddTransactionModal';
import { transactionApi } from './utils/api';
import { useAuth } from './context/AuthContext';
import { Shield, Sparkles, AlertTriangle } from 'lucide-react';

export function App() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loadingTransactions, setLoadingTransactions] = useState(true);
  const [filters, setFilters] = useState({});

  // Modals state
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [passkeyModalOpen, setPasskeyModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [addTxModalOpen, setAddTxModalOpen] = useState(false);
  const [alertCount, setAlertCount] = useState(0);

  // Fetch financial summary and transactions
  const loadData = async () => {
    try {
      // 1. Fetch summary
      const sumRes = await transactionApi.summary();
      if (sumRes.ok) {
        const sumData = await sumRes.json();
        setSummary(sumData);
      }

      // 2. Fetch transactions with filters
      setLoadingTransactions(true);
      const queryParams = new URLSearchParams();
      if (filters.search) queryParams.append('search', filters.search);
      if (filters.category) queryParams.append('category', filters.category);
      if (filters.type) queryParams.append('type', filters.type);
      if (filters.startDate) queryParams.append('startDate', filters.startDate);

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
    loadData();
  }, [filters, user]);

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAuth={() => setAuthModalOpen(true)}
        onOpenProfile={() => setProfileModalOpen(true)}
        onOpenPasskey={() => setPasskeyModalOpen(true)}
        alertCount={alertCount}
      />

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-8 space-y-8">
        {/* Banner if Unauthenticated */}
        {!user && (
          <div className="glass-panel-glow p-5 rounded-2xl border border-cyan-500/40 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-300">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-100">Welcome to FinSec ZeroTrust</h4>
                <p className="text-xs text-slate-300 mt-0.5">
                  Sign in using Passkey Biometrics or demo credentials to access protected financial ledger and AI assistant.
                </p>
              </div>
            </div>
            <button
              onClick={() => setAuthModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-md shadow-cyan-500/20 whitespace-nowrap"
            >
              Sign In / Quick Demo
            </button>
          </div>
        )}

        {/* Tab 1: Financial Dashboard */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            <MetricCards summary={summary} />
            <ExpenseCharts summary={summary} transactions={transactions} />
            <TransactionTable
              transactions={transactions}
              loading={loadingTransactions}
              filters={filters}
              setFilters={setFilters}
              onRefresh={loadData}
              onOpenAddModal={() => setAddTxModalOpen(true)}
            />
          </div>
        )}

        {/* Tab 2: Budgets & Alerts */}
        {activeTab === 'budgets' && (
          <div className="space-y-8">
            <BudgetTracker />
          </div>
        )}

        {/* Tab 3: Receipt Vision & AI Assistant */}
        {activeTab === 'ai_receipts' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <ReceiptScanner onTransactionCreated={loadData} />
            <AiAssistantWidget onActionExecuted={loadData} />
          </div>
        )}

        {/* Tab 4: SOC Threat Center & Post-Deployment Analysis */}
        {activeTab === 'soc' && (
          <div className="space-y-8">
            <SocThreatMap />
            <AdminAuditLogs />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-6 text-center text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>FinSec ZeroTrust • PS-01 FinTrack • Team ID: 74 (SleNova)</div>
          <div className="flex items-center space-x-3 text-slate-400">
            <span>FIDO2 / WebAuthn</span>
            <span>•</span>
            <span>HMAC-SHA256 Signatures</span>
            <span>•</span>
            <span>Append-Only SOC Audit</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
      <PasskeyEnrollment isOpen={passkeyModalOpen} onClose={() => setPasskeyModalOpen(false)} />
      <ProfileSettings isOpen={profileModalOpen} onClose={() => setProfileModalOpen(false)} />
      <AddTransactionModal
        isOpen={addTxModalOpen}
        onClose={() => setAddTxModalOpen(false)}
        onSuccess={loadData}
      />
    </div>
  );
}
export default App;
