import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding FinSec ZeroTrust database...');

  // 1. Create Admin User
  const adminPassword = await bcrypt.hash('Admin@Secure2026!', 10);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@finsec.local' },
    update: {},
    create: {
      email: 'admin@finsec.local',
      fullName: 'SOC Lead Architect',
      passwordHash: adminPassword,
      role: 'ADMIN'
    }
  });

  // 2. Create Demo User
  const demoPassword = await bcrypt.hash('Demo@Secure2026!', 10);
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@finsec.local' },
    update: {},
    create: {
      email: 'demo@finsec.local',
      fullName: 'Alex Vance',
      passwordHash: demoPassword,
      role: 'USER'
    }
  });

  // 3. Create Sample Transactions for Demo User
  const sampleTransactions = [
    { type: 'INCOME', category: 'Salary', amount: 5200.00, description: 'Monthly Engineering Payroll', merchant: 'TechCorp Global', date: new Date('2026-10-01T09:00:00Z') },
    { type: 'INCOME', category: 'Investment', amount: 340.50, description: 'Quarterly Dividend Payout', merchant: 'Vanguard Index', date: new Date('2026-10-02T14:30:00Z') },
    { type: 'EXPENSE', category: 'Food & Dining', amount: 48.75, description: 'Team Strategy Dinner', merchant: 'Le Bistro Central', date: new Date('2026-10-03T19:45:00Z') },
    { type: 'EXPENSE', category: 'Utilities', amount: 125.00, description: 'Fiber Optic Gigabit Internet', merchant: 'CyberNet ISP', date: new Date('2026-10-03T11:00:00Z') },
    { type: 'EXPENSE', category: 'Shopping', amount: 289.99, description: 'YubiKey 5C NFC Dual Pack', merchant: 'Yubico Store', date: new Date('2026-10-04T16:15:00Z') },
    { type: 'EXPENSE', category: 'Food & Dining', amount: 14.50, description: 'Espresso & Croissant', merchant: 'Artisan Cafe', date: new Date('2026-10-05T08:30:00Z') },
    { type: 'EXPENSE', category: 'Travel', amount: 62.40, description: 'Airport Express Rail Pass', merchant: 'Transit Authority', date: new Date('2026-10-05T10:00:00Z') }
  ];

  for (const t of sampleTransactions) {
    await prisma.transaction.create({
      data: {
        userId: demoUser.id,
        ...t
      }
    });
  }

  // 4. Create Budgets with Realistic Spending
  const sampleBudgets = [
    { category: 'Food & Dining', limitAmount: 400.00 },
    { category: 'Utilities', limitAmount: 200.00 },
    { category: 'Shopping', limitAmount: 350.00 },
    { category: 'Travel', limitAmount: 250.00 }
  ];

  for (const b of sampleBudgets) {
    await prisma.budget.upsert({
      where: {
        userId_category: {
          userId: demoUser.id,
          category: b.category
        }
      },
      update: {},
      create: {
        userId: demoUser.id,
        category: b.category,
        limitAmount: b.limitAmount
      }
    });
  }

  // 5. Seed Pre-existing Threat Logs for SOC Threat Map Visualization
  const threatSeeds = [
    { eventType: 'HONEYPOT_TRIGGER', severity: 'CRITICAL', ipAddress: '185.220.101.5', endpoint: '/api/v1/admin/login-v1', payload: '{"user":"admin","pass":"toor"}', latitude: 52.5200, longitude: 13.4050, locationName: 'Berlin, Germany', actionTaken: 'BANNED' },
    { eventType: 'SQLI_ATTEMPT', severity: 'CRITICAL', ipAddress: '45.154.255.88', endpoint: '/api/v1/transactions', payload: '{"category":"Food\' UNION SELECT username,password FROM users --"}', latitude: 55.7558, longitude: 37.6173, locationName: 'Moscow, Russia', actionTaken: 'BLOCKED' },
    { eventType: 'RATE_LIMIT_EXCEEDED', severity: 'MEDIUM', ipAddress: '103.251.167.22', endpoint: '/api/v1/auth/login', payload: 'Brute force credential stuffing attempt', latitude: 28.6139, longitude: 77.2090, locationName: 'New Delhi, India', actionTaken: 'THROTTLED' },
    { eventType: 'HONEYPOT_TRIGGER', severity: 'CRITICAL', ipAddress: '194.26.29.112', endpoint: '/api/v1/admin/login-v1', payload: '{"probe":"curl -s http://169.254.169.254"}', latitude: 37.7749, longitude: -122.4194, locationName: 'San Francisco, USA', actionTaken: 'BANNED' },
    { eventType: 'SQLI_ATTEMPT', severity: 'CRITICAL', ipAddress: '109.237.103.41', endpoint: '/api/v1/transactions', payload: '{"search":"\' OR 1=1 --"}', latitude: 50.4501, longitude: 30.5234, locationName: 'Kyiv, Ukraine', actionTaken: 'BLOCKED' }
  ];

  for (const t of threatSeeds) {
    await prisma.securityLog.create({ data: t });
  }

  console.log('Seeding completed successfully!');
  console.log('Admin account: admin@finsec.local / Admin@Secure2026!');
  console.log('Demo user account: demo@finsec.local / Demo@Secure2026!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
