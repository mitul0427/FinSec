/**
 * Lightweight, Explainable Rule-Based Financial Anomaly Detection Engine
 * Zero black-box ML: strictly deterministic, grounded in actual user spending patterns.
 */
export const detectTransactionAnomalies = async (prismaClient, userId) => {
  const [transactions, budgets] = await Promise.all([
    prismaClient.transaction.findMany({
      where: { userId },
      orderBy: { date: 'desc' }
    }),
    prismaClient.budget.findMany({
      where: { userId }
    })
  ]);

  const anomalies = [];
  const expenses = transactions.filter((t) => t.type === 'EXPENSE');

  if (expenses.length === 0 && budgets.length === 0) {
    return {
      totalAnomalies: 0,
      anomalies: []
    };
  }

  // 1. Calculate historical expense average
  let totalExpenseAmount = 0;
  for (const e of expenses) {
    totalExpenseAmount += e.amount;
  }
  const avgExpense = expenses.length > 0 ? totalExpenseAmount / expenses.length : 0;

  // Rule 1: High-Value Anomaly (Transaction > 2.5x recent average expense)
  if (expenses.length >= 3 && avgExpense > 0) {
    for (const t of expenses.slice(0, 10)) {
      if (t.amount >= avgExpense * 2.5 && t.amount > 100) {
        anomalies.push({
          id: `anomaly_high_${t.id}`,
          type: 'HIGH_VALUE_EXPENSE',
          severity: 'HIGH',
          title: 'Unusual Spending Spike Detected',
          explanation: `₹${t.amount.toFixed(2)} for "${t.description}" is ${((t.amount / avgExpense)).toFixed(1)}x higher than your historical average expense of ₹${avgExpense.toFixed(2)}.`,
          transactionId: t.id,
          date: t.date,
          amount: t.amount,
          category: t.category
        });
      }
    }
  }

  // Rule 2: Duplicate / Accidental Double Charge Detection (Same amount & category within 24 hours)
  for (let i = 0; i < expenses.length; i++) {
    for (let j = i + 1; j < expenses.length; j++) {
      const a = expenses[i];
      const b = expenses[j];
      const timeDiffHours = Math.abs(new Date(a.date).getTime() - new Date(b.date).getTime()) / (1000 * 60 * 60);

      if (timeDiffHours <= 24 && Math.abs(a.amount - b.amount) < 0.01 && a.category === b.category) {
        anomalies.push({
          id: `anomaly_dup_${a.id}_${b.id}`,
          type: 'POTENTIAL_DUPLICATE_CHARGE',
          severity: 'MEDIUM',
          title: 'Potential Duplicate Transaction',
          explanation: `Two identical charges of ₹${a.amount.toFixed(2)} in "${a.category}" were recorded within ${timeDiffHours.toFixed(1)} hours ("${a.description}" and "${b.description}").`,
          transactionId: a.id,
          date: a.date,
          amount: a.amount,
          category: a.category
        });
        break; // Only flag once per transaction
      }
    }
  }

  // Rule 3: Budget Overrun & Proximity Warning
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const currentMonthExpenses = expenses.filter((t) => {
    const d = new Date(t.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const categorySpending = {};
  for (const t of currentMonthExpenses) {
    categorySpending[t.category] = (categorySpending[t.category] || 0) + t.amount;
  }

  for (const b of budgets) {
    const spent = categorySpending[b.category] || 0;
    if (spent > b.limitAmount) {
      anomalies.push({
        id: `anomaly_budget_exceeded_${b.id}`,
        type: 'BUDGET_EXCEEDED',
        severity: 'CRITICAL',
        title: `Budget Limit Exceeded: ${b.category}`,
        explanation: `Current month spending in ${b.category} (₹${spent.toFixed(2)}) exceeds your configured limit of ₹${b.limitAmount.toFixed(2)} by ₹${(spent - b.limitAmount).toFixed(2)}.`,
        category: b.category,
        amount: spent,
        limitAmount: b.limitAmount
      });
    } else if (b.limitAmount > 0 && spent >= b.limitAmount * 0.85) {
      anomalies.push({
        id: `anomaly_budget_warn_${b.id}`,
        type: 'BUDGET_THRESHOLD_WARNING',
        severity: 'LOW',
        title: `Budget Near Threshold: ${b.category}`,
        explanation: `Current month spending in ${b.category} has reached ${((spent / b.limitAmount) * 100).toFixed(0)}% of your limit (₹${spent.toFixed(2)} / ₹${b.limitAmount.toFixed(2)}).`,
        category: b.category,
        amount: spent,
        limitAmount: b.limitAmount
      });
    }
  }

  return {
    totalAnomalies: anomalies.length,
    anomalies
  };
};
