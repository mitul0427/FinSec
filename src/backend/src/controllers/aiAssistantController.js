import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';
import prisma from '../config/prisma.js';
import { getNextLedgerBlock } from '../services/ledgerService.js';
import { broadcastSecurityAlert } from '../services/socketService.js';

// Strict Zod schemas defining allowed AI action execution payloads
export const createTransactionActionSchema = z.object({
  type: z.enum(['INCOME', 'EXPENSE']),
  amount: z.number().positive('Amount must be positive'),
  category: z.string().min(1, 'Category is required'),
  description: z.string().min(1, 'Description is required'),
  merchant: z.string().optional()
});

export const setBudgetActionSchema = z.object({
  category: z.string().min(1, 'Category is required'),
  limitAmount: z.number().positive('Limit amount must be positive')
});

const PROMPT_INJECTION_PATTERNS = [
  /ignore (all |previous |prior )?instructions/i,
  /make me (an )?admin/i,
  /grant (me )?admin/i,
  /set role (to )?admin/i,
  /elevate (my )?role/i,
  /system prompt/i,
  /drop (table|database)/i,
  /bypass (security|auth|rules)/i,
  /show (all |other )?users/i
];

/**
 * 1. Process Natural Language Query -> Structured Action Proposal
 * NEVER executes mutations directly. AI output is untrusted.
 */
export const handleAiQuery = async (req, res) => {
  try {
    const { query } = req.body;
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Query string is required.' });
    }

    const userId = req.user.id;

    // Defense: Active Prompt Injection & Privilege Escalation Inspection
    const isMalicious = PROMPT_INJECTION_PATTERNS.some((pattern) => pattern.test(query));
    if (isMalicious) {
      await prisma.securityLog.create({
        data: {
          eventType: 'AI_PROMPT_INJECTION',
          severity: 'HIGH',
          ipAddress: req.ip || '127.0.0.1',
          endpoint: '/api/v1/ai/assistant',
          payload: query.slice(0, 500),
          actionTaken: 'BLOCKED'
        }
      });

      broadcastSecurityAlert({
        eventType: 'AI_PROMPT_INJECTION',
        severity: 'HIGH',
        message: 'Blocked adversarial prompt injection attempt in AI Assistant'
      });

      return res.status(200).json({
        query,
        reply: 'Security Alert: Prompt injection or unauthorized administrative escalation attempt detected and blocked. Financial assistant operates strictly under Zero Trust boundaries.',
        proposal: null,
        securityAlert: true
      });
    }

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

    if (apiKey) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const prompt = `You are FinSec AI, an intelligent, security-first personal finance assistant.
Analyze this user query: "${query}".

Recent User Transactions: ${JSON.stringify(recentTransactions)}
User Budgets: ${JSON.stringify(budgets)}

You propose financial actions for user confirmation. Respond ONLY with a valid JSON object:
{
  "message": "Clear conversational advice or explanation of proposed action",
  "action": null OR {
    "name": "CREATE_TRANSACTION" | "SET_BUDGET",
    "params": { ... }
  }
}
If adding expense/income, set action.name to "CREATE_TRANSACTION" with params: type, amount, category, description.
If setting budget, set action.name to "SET_BUDGET" with params: category, limitAmount.
Otherwise set action to null.
Do not include markdown fences.`;

        const result = await model.generateContent(prompt);
        const text = result.response.text().trim().replace(/```json/g, '').replace(/```/g, '').trim();
        aiResponse = JSON.parse(text);
      } catch (err) {
        console.warn('Gemini AI Assistant notice, using local intent parser:', err.message);
      }
    }

    // Heuristic Intent Parser fallback
    if (!aiResponse) {
      const lower = query.toLowerCase();
      const expenseMatch = lower.match(/(spent|spend|paid|add expense|expense)\s+([₹$]?\s*[0-9]+(\.[0-9]{1,2})?)\s+(on|for)\s+([a-zA-Z\s]+)/i);
      const budgetMatch = lower.match(/(set budget|budget)\s+(of\s+)?([₹$]?\s*[0-9]+)\s+(for|on)\s+([a-zA-Z\s]+)/i);

      if (expenseMatch) {
        const rawAmount = expenseMatch[2].replace(/[₹$,\s]/g, '');
        const amount = parseFloat(rawAmount);
        const desc = expenseMatch[5].trim();
        let cat = 'Food & Dining';
        if (desc.includes('uber') || desc.includes('flight') || desc.includes('gas') || desc.includes('metro')) cat = 'Travel';
        else if (desc.includes('rent') || desc.includes('electric') || desc.includes('wifi') || desc.includes('water')) cat = 'Utilities';
        else if (desc.includes('book') || desc.includes('shirt') || desc.includes('amazon') || desc.includes('shopping')) cat = 'Shopping';

        aiResponse = {
          message: `I've prepared a proposed expense of ₹${amount.toFixed(2)} for "${desc}" under ${cat}. Please review and confirm to append it to your tamper-evident ledger.`,
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
        const rawAmount = budgetMatch[3].replace(/[₹$,\s]/g, '');
        const amount = parseFloat(rawAmount);
        const cat = budgetMatch[5].trim();
        aiResponse = {
          message: `I've prepared a proposed monthly budget of ₹${amount.toFixed(2)} for ${cat}. Please review and confirm.`,
          action: {
            name: 'SET_BUDGET',
            params: {
              category: cat,
              limitAmount: amount
            }
          }
        };
      } else {
        aiResponse = {
          message: `You currently have ${recentTransactions.length} recorded transactions and ${budgets.length} active budgets. Try asking: "Spent ₹500 on dinner" or "Set budget ₹1500 for Utilities".`,
          action: null
        };
      }
    }

    // Build structured proposal with Zero-Trust validation
    let proposal = null;
    if (aiResponse.action) {
      if (aiResponse.action.name === 'CREATE_TRANSACTION') {
        const check = createTransactionActionSchema.safeParse(aiResponse.action.params);
        if (check.success) {
          proposal = {
            type: 'CREATE_TRANSACTION',
            transaction: check.data,
            requiresConfirmation: true
          };
        }
      } else if (aiResponse.action.name === 'SET_BUDGET') {
        const check = setBudgetActionSchema.safeParse(aiResponse.action.params);
        if (check.success) {
          proposal = {
            type: 'SET_BUDGET',
            budget: check.data,
            requiresConfirmation: true
          };
        }
      }
    }

    // Return proposal without mutating database
    return res.json({
      query,
      reply: aiResponse.message,
      proposal,
      actionExecuted: false
    });
  } catch (err) {
    console.error('handleAiQuery error:', err);
    return res.status(500).json({ error: 'AI processing failed.', details: err.message });
  }
};

/**
 * 2. Secure Action Gateway Confirmation
 * Executes user-confirmed proposal under strict Zero-Trust re-validation,
 * session user binding, and ledger chaining.
 */
export const confirmAiAction = async (req, res) => {
  try {
    const { action } = req.body;
    if (!action || typeof action !== 'object') {
      return res.status(400).json({ error: 'Action payload is required.' });
    }

    // Defense: Disallow any role or administrative mutation via AI action gateway
    if (['SET_ROLE', 'ELEVATE_ROLE', 'GRANT_ADMIN', 'UPDATE_USER_ROLE'].includes(action.type)) {
      await prisma.securityLog.create({
        data: {
          eventType: 'UNAUTHORIZED_PRIVILEGE_ESCALATION',
          severity: 'CRITICAL',
          ipAddress: req.ip || '127.0.0.1',
          endpoint: '/api/v1/ai/action/confirm',
          payload: JSON.stringify(action).slice(0, 500),
          actionTaken: 'BLOCKED'
        }
      });

      broadcastSecurityAlert({
        eventType: 'UNAUTHORIZED_PRIVILEGE_ESCALATION',
        severity: 'CRITICAL',
        message: 'Blocked adversarial attempt to elevate privileges via AI Action Gateway'
      });

      return res.status(403).json({
        error: 'Privilege escalation blocked: AI Gateway is forbidden from modifying user roles or administrative policies.',
        code: 'ROLE_ELEVATION_DENIED'
      });
    }

    if (action.type === 'CREATE_TRANSACTION') {
      const dataToValidate = action.transaction || action.params;
      const parsed = createTransactionActionSchema.safeParse(dataToValidate);
      if (!parsed.success) {
        return res.status(400).json({
          error: 'Validation failed for transaction proposal',
          issues: parsed.error.issues
        });
      }

      const { type, amount, category, description, merchant } = parsed.data;
      const txDate = new Date();

      const transaction = await prisma.$transaction(async (tx) => {
        // Authenticated user ID strictly enforced: AI cannot choose or spoof another userId
        const ledgerBlock = await getNextLedgerBlock(tx, req.user.id, {
          type,
          category,
          amount,
          date: txDate,
          description,
          merchant: merchant || null
        });

        return await tx.transaction.create({
          data: {
            userId: req.user.id,
            type,
            category,
            amount,
            date: txDate,
            description,
            merchant: merchant || null,
            ledgerIndex: ledgerBlock.ledgerIndex,
            previousHash: ledgerBlock.previousHash,
            transactionHash: ledgerBlock.transactionHash
          }
        });
      });

      return res.status(201).json({
        success: true,
        message: 'Action confirmed: Transaction recorded and cryptographically chained to ledger.',
        transaction
      });
    }

    if (action.type === 'SET_BUDGET') {
      const dataToValidate = action.budget || action.params;
      const parsed = setBudgetActionSchema.safeParse(dataToValidate);
      if (!parsed.success) {
        return res.status(400).json({
          error: 'Validation failed for budget proposal',
          issues: parsed.error.issues
        });
      }

      const { category, limitAmount } = parsed.data;
      const budget = await prisma.budget.upsert({
        where: {
          userId_category: {
            userId: req.user.id,
            category
          }
        },
        update: { limitAmount },
        create: {
          userId: req.user.id,
          category,
          limitAmount
        }
      });

      return res.status(200).json({
        success: true,
        message: `Action confirmed: Monthly budget of ₹${limitAmount.toFixed(2)} set for ${category}.`,
        budget
      });
    }

    return res.status(400).json({
      error: `Unsupported action type: "${action.type}". Allowed types: CREATE_TRANSACTION, SET_BUDGET.`,
      code: 'UNSUPPORTED_ACTION_TYPE'
    });
  } catch (err) {
    console.error('confirmAiAction error:', err);
    return res.status(500).json({ error: 'Failed to execute confirmed action.', details: err.message });
  }
};
