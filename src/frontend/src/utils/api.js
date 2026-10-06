// FinSec ZeroTrust Frontend Mock API Client - Zero Backend Dependency for Production Stability

const getStoredItem = (key, fallback) => {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : fallback;
  } catch (e) {
    return fallback;
  }
};

const setStoredItem = (key, val) => {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {}
};

const INITIAL_MOCK_TRANSACTIONS = [
  { id: 'tx-101', type: 'INCOME', category: 'Salary', amount: 5200.00, description: 'Monthly Engineering Payroll', merchant: 'TechCorp Global', date: '2026-10-01T09:00:00Z', status: 'COMPLETED' },
  { id: 'tx-102', type: 'INCOME', category: 'Investment', amount: 340.50, description: 'Quarterly Dividend Payout', merchant: 'Vanguard Index', date: '2026-10-02T14:30:00Z', status: 'COMPLETED' },
  { id: 'tx-103', type: 'EXPENSE', category: 'Food & Dining', amount: 48.75, description: 'Team Strategy Dinner', merchant: 'Le Bistro Central', date: '2026-10-03T19:45:00Z', status: 'COMPLETED' },
  { id: 'tx-104', type: 'EXPENSE', category: 'Utilities', amount: 125.00, description: 'Fiber Optic Gigabit Internet', merchant: 'CyberNet ISP', date: '2026-10-03T11:00:00Z', status: 'COMPLETED' },
  { id: 'tx-105', type: 'EXPENSE', category: 'Shopping', amount: 289.99, description: 'YubiKey 5C NFC Dual Pack', merchant: 'Yubico Store', date: '2026-10-04T16:15:00Z', status: 'COMPLETED' },
  { id: 'tx-106', type: 'EXPENSE', category: 'Food & Dining', amount: 14.50, description: 'Espresso & Croissant', merchant: 'Artisan Cafe', date: '2026-10-05T08:30:00Z', status: 'COMPLETED' },
  { id: 'tx-107', type: 'EXPENSE', category: 'Travel', amount: 62.40, description: 'Airport Express Rail Pass', merchant: 'Transit Authority', date: '2026-10-05T10:00:00Z', status: 'COMPLETED' }
];

const INITIAL_MOCK_BUDGETS = [
  { id: 'b-1', category: 'Food & Dining', limitAmount: 400.00, spent: 63.25 },
  { id: 'b-2', category: 'Utilities', limitAmount: 200.00, spent: 125.00 },
  { id: 'b-3', category: 'Shopping', limitAmount: 350.00, spent: 289.99 },
  { id: 'b-4', category: 'Travel', limitAmount: 250.00, spent: 62.40 }
];

export const getAccessToken = () => localStorage.getItem('finsec_access_token') || 'mock_jwt_token_demo';
export const setAccessToken = (token) => {
  if (token) localStorage.setItem('finsec_access_token', token);
  else localStorage.removeItem('finsec_access_token');
};

const createMockResponse = (data, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => data
});

// Mock Auth API
export const authApi = {
  login: async ({ email }) => {
    const cleanEmail = (email || '').trim().toLowerCase();
    const isAdmin = cleanEmail.includes('admin');
    const user = {
      id: isAdmin ? 'USR-ADMIN-001' : 'USR-001',
      email: cleanEmail,
      fullName: isAdmin ? 'Chief Security Officer' : 'Gadiel Machado',
      role: isAdmin ? 'admin' : 'user',
      avatar: isAdmin
        ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=256'
        : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256'
    };
    setAccessToken('mock_jwt_' + Date.now());
    localStorage.setItem('finsec_mock_user', JSON.stringify(user));
    return createMockResponse({ accessToken: 'mock_jwt_' + Date.now(), user });
  },
  register: async (data) => createMockResponse({ user: data }),
  logout: async () => {
    localStorage.removeItem('finsec_access_token');
    localStorage.removeItem('finsec_mock_user');
    return createMockResponse({ success: true });
  },
  profile: async () => {
    const user = getStoredItem('finsec_mock_user', {
      id: 'USR-001',
      email: 'user@finesec.com',
      fullName: 'Gadiel Machado',
      role: 'user'
    });
    return createMockResponse({ user });
  },
  updateProfile: async (data) => {
    const cur = getStoredItem('finsec_mock_user', {});
    const updated = { ...cur, ...data };
    setStoredItem('finsec_mock_user', updated);
    return createMockResponse({ user: updated });
  },
  webauthnRegisterOptions: async () => createMockResponse({ challenge: 'mock_challenge' }),
  webauthnVerifyRegistration: async () => createMockResponse({ verified: true }),
  webauthnAuthOptions: async () => createMockResponse({ challenge: 'mock_challenge' }),
  webauthnVerifyAuth: async () => createMockResponse({ verified: true })
};

// Mock Transaction API
export const transactionApi = {
  list: async () => {
    const txs = getStoredItem('finsec_transactions', INITIAL_MOCK_TRANSACTIONS);
    return createMockResponse({ transactions: txs });
  },
  summary: async () => {
    const txs = getStoredItem('finsec_transactions', INITIAL_MOCK_TRANSACTIONS);
    let totalIncome = 0;
    let totalExpenses = 0;
    txs.forEach((t) => {
      if (t.type === 'INCOME') totalIncome += Number(t.amount);
      else totalExpenses += Number(t.amount);
    });
    return createMockResponse({
      totalIncome,
      totalExpenses,
      balance: totalIncome - totalExpenses,
      totalBudget: 1200.00
    });
  },
  create: async (data) => {
    const txs = getStoredItem('finsec_transactions', INITIAL_MOCK_TRANSACTIONS);
    const newTx = {
      id: 'tx-' + Date.now(),
      ...data,
      date: new Date().toISOString(),
      status: 'COMPLETED'
    };
    const updated = [newTx, ...txs];
    setStoredItem('finsec_transactions', updated);
    return createMockResponse({ transaction: newTx });
  },
  update: async (id, data) => {
    const txs = getStoredItem('finsec_transactions', INITIAL_MOCK_TRANSACTIONS);
    const updated = txs.map((t) => (t.id === id ? { ...t, ...data } : t));
    setStoredItem('finsec_transactions', updated);
    return createMockResponse({ success: true });
  },
  delete: async (id) => {
    const txs = getStoredItem('finsec_transactions', INITIAL_MOCK_TRANSACTIONS);
    const updated = txs.filter((t) => t.id !== id);
    setStoredItem('finsec_transactions', updated);
    return createMockResponse({ success: true });
  },
  exportUrl: () => '#',
  verifyLedger: async () => createMockResponse({ valid: true, message: 'Ledger integrity verified' })
};

// Mock Budget API
export const budgetApi = {
  list: async () => {
    const budgets = getStoredItem('finsec_budgets', INITIAL_MOCK_BUDGETS);
    return createMockResponse({ budgets });
  },
  set: async (data) => {
    const budgets = getStoredItem('finsec_budgets', INITIAL_MOCK_BUDGETS);
    const updated = [...budgets.filter((b) => b.category !== data.category), { id: 'b-' + Date.now(), ...data, spent: 0 }];
    setStoredItem('finsec_budgets', updated);
    return createMockResponse({ success: true });
  },
  delete: async (id) => {
    const budgets = getStoredItem('finsec_budgets', INITIAL_MOCK_BUDGETS);
    const updated = budgets.filter((b) => b.id !== id);
    setStoredItem('finsec_budgets', updated);
    return createMockResponse({ success: true });
  }
};

// Mock Receipt API
export const receiptApi = {
  scan: async () => {
    return createMockResponse({
      merchant: 'Whole Foods Market',
      totalAmount: 48.75,
      date: '2026-10-05',
      category: 'Food & Dining'
    });
  }
};

// Mock AI API
export const aiApi = {
  assistant: async (query) => {
    return createMockResponse({
      response: `[FinSec AI Assistant]: I have analyzed your financial ledger. Your spending in Food & Dining is currently within normal thresholds. Zero anomalies detected in last 24h.`
    });
  },
  confirmAction: async () => createMockResponse({ success: true })
};

// Mock SOC API
export const socApi = {
  stats: async () => createMockResponse({ blockedIps: 12, threatsIntercepted: 47, honeypotHits: 8 }),
  logs: async () => createMockResponse({ logs: [] }),
  simulateAttack: async () => createMockResponse({ success: true, message: 'Simulated SQLi attack blocked.' }),
  triggerHoneypot: async () => createMockResponse({ success: true, message: 'Honeypot triggered. IP Banned.' })
};

// Mock Bank API
export const bankApi = {
  simulateWebhook: async () => createMockResponse({ success: true }),
  approve: async () => createMockResponse({ success: true }),
  block: async () => createMockResponse({ success: true })
};
