import prisma from '../config/prisma.js';
import { z } from 'zod';

const budgetSchema = z.object({
  category: z.string().min(1, 'Category is required'),
  limitAmount: z.number().positive('Limit amount must be positive'),
  period: z.string().default('MONTHLY')
});

// 1. Get Budgets with Live Spending & Threshold Alert Status
export const getBudgets = async (req, res) => {
  try {
    const userId = req.user.id;
    const budgets = await prisma.budget.findMany({
      where: { userId }
    });

    // Compute current month start and end
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // Fetch this month's expenses
    const monthlyExpenses = await prisma.transaction.findMany({
      where: {
        userId,
        type: 'EXPENSE',
        date: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      }
    });

    const spentByCategory = {};
    for (const exp of monthlyExpenses) {
      spentByCategory[exp.category] = (spentByCategory[exp.category] || 0) + exp.amount;
    }

    const budgetsWithStatus = budgets.map((b) => {
      const spent = spentByCategory[b.category] || 0;
      const percentage = (spent / b.limitAmount) * 100;
      let status = 'NORMAL'; // 'NORMAL' | 'WARNING' (>80%) | 'EXCEEDED' (>100%)

      if (percentage >= 100) {
        status = 'EXCEEDED';
      } else if (percentage >= 80) {
        status = 'WARNING';
      }

      return {
        ...b,
        spent,
        remaining: Math.max(0, b.limitAmount - spent),
        percentage: Number(percentage.toFixed(1)),
        status
      };
    });

    return res.json({ budgets: budgetsWithStatus });
  } catch (err) {
    console.error('getBudgets error:', err);
    return res.status(500).json({ error: 'Failed to fetch budgets.' });
  }
};

// 2. Create or Upsert Budget
export const setBudget = async (req, res) => {
  try {
    const parsed = budgetSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Validation failed', issues: parsed.error.issues });
    }

    const { category, limitAmount, period } = parsed.data;

    const budget = await prisma.budget.upsert({
      where: {
        userId_category: {
          userId: req.user.id,
          category
        }
      },
      update: {
        limitAmount,
        period: period || 'MONTHLY'
      },
      create: {
        userId: req.user.id,
        category,
        limitAmount,
        period: period || 'MONTHLY'
      }
    });

    return res.json({ message: 'Budget configured successfully.', budget });
  } catch (err) {
    console.error('setBudget error:', err);
    return res.status(500).json({ error: 'Failed to configure budget.' });
  }
};

// 3. Delete Budget
export const deleteBudget = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.budget.findFirst({
      where: { id, userId: req.user.id }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Budget not found.' });
    }

    await prisma.budget.delete({ where: { id } });
    return res.json({ message: 'Budget deleted.' });
  } catch (err) {
    console.error('deleteBudget error:', err);
    return res.status(500).json({ error: 'Failed to delete budget.' });
  }
};
