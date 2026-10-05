import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';
import prisma from '../config/prisma.js';

// Zod schemas defining allowed AI action executions
const createTransactionActionSchema = z.object({
  type: z.enum(['INCOME', 'EXPENSE']),
  amount: z.number().positive(),
  category: z.string(),
  description: z.string(),
  merchant: z.string().optional()
});

const setBudgetActionSchema = z.object({
  category: z.string(),
  limitAmount: z.number().positive()
});

export const handleAiQuery = async (req, res) => {
  try {
    const { query } = req.body;
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Query string is required.' });
    }

    const userId = req.user.id;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const apiKey = user?.customGeminiKey || process.env.GEMINI_API_KEY;

    // Fetch brief user context for the AI
    const [recentTransactions, budgets] = await Promise.all([
      prisma.transaction.findMany({
        where: { userId },
        orderBy: { date: 'desc' },
        take: 5
      }),
      prisma.budget.findMany({ where: { userId } })
    ]);

    let aiResponse = null;
    let parsedAction = null;

    if (apiKey) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const prompt = `You are FinSec AI, an intelligent, security-first personal finance assistant.
Analyze this user query: "${query}".

Recent User Transactions: ${JSON.stringify(recentTransactions)}
User Budgets: ${JSON.stringify(budgets)}

You can execute financial actions. Respond ONLY with a valid JSON object with:
{
  "message": "Clear, friendly, conversational advice or confirmation",
  "action": null OR {
    "name": "CREATE_TRANSACTION" | "SET_BUDGET",
    "params": { ... }
  }
}
If the user wants to add an expense or income, set action.name to "CREATE_TRANSACTION".
If the user wants to set a budget, set action.name to "SET_BUDGET".
Otherwise set action to null.
Do not include markdown fences.`;

        const result = await model.generateContent(prompt);
        const text = result.response.text().trim().replace(/```json/g, '').replace(/```/g, '').trim();
        aiResponse = JSON.parse(text);
      } catch (err) {
        console.warn('Gemini AI Assistant error, using local intent parser:', err.message);
      }
    }

    // Heuristic Intent Parser fallback
    if (!aiResponse) {
      const lower = query.toLowerCase();

      // Check for transaction creation intent: e.g. "spent 25 on coffee" or "add expense 50 for groceries"
      const expenseMatch = lower.match(/(spent|spend|paid|add expense|expense)\s+\$?([0-9]+(\.[0-9]{1,2})?)\s+(on|for)\s+([a-zA-Z\s]+)/i);
      const budgetMatch = lower.match(/(set budget|budget)\s+(of\s+)?\$?([0-9]+)\s+(for|on)\s+([a-zA-Z\s]+)/i);

      if (expenseMatch) {
        const amount = parseFloat(expenseMatch[2]);
        const desc = expenseMatch[5].trim();
        let cat = 'Food & Dining';
        if (desc.includes('uber') || desc.includes('flight') || desc.includes('gas')) cat = 'Travel';
        else if (desc.includes('rent') || desc.includes('electric') || desc.includes('wifi')) cat = 'Utilities';
        else if (desc.includes('book') || desc.includes('shirt') || desc.includes('amazon')) cat = 'Shopping';

        aiResponse = {
          message: `I've prepared an expense of $${amount.toFixed(2)} for "${desc}" under ${cat}.`,
          action: {
            name: 'CREATE_TRANSACTION',
            params: {
              type: 'EXPENSE',
              amount,
              category: cat,
              description: desc
            }
          }
        };
      } else if (budgetMatch) {
        const amount = parseFloat(budgetMatch[3]);
        const cat = budgetMatch[5].trim();
        aiResponse = {
          message: `I've configured a monthly budget of $${amount.toFixed(2)} for ${cat}.`,
          action: {
            name: 'SET_BUDGET',
            params: {
              category: cat,
              limitAmount: amount
            }
          }
        };
      } else {
        // General financial Q&A
        aiResponse = {
          message: `You currently have ${recentTransactions.length} recorded transactions and ${budgets.length} active budget goals. I can record expenses, analyze budget headroom, or help categorize purchases. Try saying: "Spent $15 on lunch" or "Set budget $300 for Utilities".`,
          action: null
        };
      }
    }

    // Execute database action if verified by Zod schema
    let executedResult = null;
    if (aiResponse.action) {
      if (aiResponse.action.name === 'CREATE_TRANSACTION') {
        const check = createTransactionActionSchema.safeParse(aiResponse.action.params);
        if (check.success) {
          executedResult = await prisma.transaction.create({
            data: {
              userId,
              ...check.data
            }
          });
        }
      } else if (aiResponse.action.name === 'SET_BUDGET') {
        const check = setBudgetActionSchema.safeParse(aiResponse.action.params);
        if (check.success) {
          executedResult = await prisma.budget.upsert({
            where: {
              userId_category: {
                userId,
                category: check.data.category
              }
            },
            update: { limitAmount: check.data.limitAmount },
            create: {
              userId,
              category: check.data.category,
              limitAmount: check.data.limitAmount
            }
          });
        }
      }
    }

    return res.json({
      query,
      reply: aiResponse.message,
      actionExecuted: !!executedResult,
      actionData: executedResult
    });
  } catch (err) {
    console.error('handleAiQuery error:', err);
    return res.status(500).json({ error: 'AI processing failed.', details: err.message });
  }
};
