import prisma from '../config/prisma.js';
import { z } from 'zod';

const transactionSchema = z.object({
  type: z.enum(['INCOME', 'EXPENSE']),
  category: z.string().min(1, 'Category is required'),
  amount: z.number().positive('Amount must be positive'),
  date: z.string().optional(),
  description: z.string().min(1, 'Description is required'),
  merchant: z.string().optional()
});

// 1. Get Transactions with Search & Filtering
export const getTransactions = async (req, res) => {
  try {
    const userId = req.user.id;
    const { category, type, startDate, endDate, search, limit = 50, offset = 0 } = req.query;

    const where = { userId };

    if (category) {
      where.category = String(category);
    }

    if (type && ['INCOME', 'EXPENSE'].includes(type)) {
      where.type = type;
    }

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(String(startDate));
      if (endDate) where.date.lte = new Date(String(endDate));
    }

    if (search) {
      where.OR = [
        { description: { contains: String(search) } },
        { merchant: { contains: String(search) } }
      ];
    }

    const [transactions, totalCount] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { date: 'desc' },
        take: Number(limit),
        skip: Number(offset)
      }),
      prisma.transaction.count({ where })
    ]);

    return res.json({
      transactions,
      pagination: {
        total: totalCount,
        limit: Number(limit),
        offset: Number(offset)
      }
    });
  } catch (err) {
    console.error('getTransactions error:', err);
    return res.status(500).json({ error: 'Failed to fetch transactions.' });
  }
};

// 2. Financial Summary & Analytics
export const getSummary = async (req, res) => {
  try {
    const userId = req.user.id;
    const transactions = await prisma.transaction.findMany({
      where: { userId }
    });

    let totalIncome = 0;
    let totalExpense = 0;
    const categoryBreakdown = {};

    for (const t of transactions) {
      // ZeroTrust: Only COMPLETED transactions affect account balance and spending metrics
      if (t.status === 'PENDING_CONFIRMATION' || t.status === 'BLOCKED') {
        continue;
      }

      if (t.type === 'INCOME') {
        totalIncome += t.amount;
      } else {
        totalExpense += t.amount;
        categoryBreakdown[t.category] = (categoryBreakdown[t.category] || 0) + t.amount;
      }
    }

    const netSavings = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? ((netSavings / totalIncome) * 100).toFixed(1) : 0;

    return res.json({
      totalIncome,
      totalExpense,
      netSavings,
      savingsRate: Number(savingsRate),
      transactionCount: transactions.length,
      categoryBreakdown
    });
  } catch (err) {
    console.error('getSummary error:', err);
    return res.status(500).json({ error: 'Failed to compute financial summary.' });
  }
};

// 3. Create Transaction
export const createTransaction = async (req, res) => {
  try {
    const parsed = transactionSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Validation failed', issues: parsed.error.issues });
    }

    const { type, category, amount, date, description, merchant } = parsed.data;

    const transaction = await prisma.transaction.create({
      data: {
        userId: req.user.id,
        type,
        category,
        amount,
        date: date ? new Date(date) : new Date(),
        description,
        merchant: merchant || null
      }
    });

    return res.status(201).json({ message: 'Transaction recorded.', transaction });
  } catch (err) {
    console.error('createTransaction error:', err);
    return res.status(500).json({ error: 'Failed to create transaction.' });
  }
};

// 4. Update Transaction
export const updateTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const parsed = transactionSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Validation failed', issues: parsed.error.issues });
    }

    const existing = await prisma.transaction.findFirst({
      where: { id, userId: req.user.id }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Transaction not found or access denied.' });
    }

    const data = { ...parsed.data };
    if (data.date) {
      data.date = new Date(data.date);
    }

    const updated = await prisma.transaction.update({
      where: { id },
      data
    });

    return res.json({ message: 'Transaction updated.', transaction: updated });
  } catch (err) {
    console.error('updateTransaction error:', err);
    return res.status(500).json({ error: 'Failed to update transaction.' });
  }
};

// 5. Delete Transaction
export const deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.transaction.findFirst({
      where: { id, userId: req.user.id }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Transaction not found or access denied.' });
    }

    await prisma.transaction.delete({ where: { id } });
    return res.json({ message: 'Transaction deleted successfully.' });
  } catch (err) {
    console.error('deleteTransaction error:', err);
    return res.status(500).json({ error: 'Failed to delete transaction.' });
  }
};

// 6. Data Export: CSV / JSON (GET /api/v1/transactions/export)
export const exportTransactions = async (req, res) => {
  try {
    const userId = req.user.id;
    const format = (req.query.format || 'csv').toLowerCase();

    const transactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { date: 'desc' }
    });

    const timestamp = new Date().toISOString().split('T')[0];

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="fintrack_transactions_${timestamp}.json"`);
      return res.send(JSON.stringify(transactions, null, 2));
    }

    // Default: CSV format
    const headers = ['ID', 'Date', 'Type', 'Category', 'Amount', 'Description', 'Merchant'];
    const rows = transactions.map((t) => [
      t.id,
      t.date.toISOString(),
      t.type,
      `"${t.category.replace(/"/g, '""')}"`,
      t.amount.toFixed(2),
      `"${t.description.replace(/"/g, '""')}"`,
      `"${(t.merchant || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="fintrack_transactions_${timestamp}.csv"`);
    return res.send(csvContent);
  } catch (err) {
    console.error('exportTransactions error:', err);
    return res.status(500).json({ error: 'Export failed.' });
  }
};
