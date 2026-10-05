import { PrismaClient } from '@prisma/client';

const basePrisma = new PrismaClient();

// Enforce Append-Only Immutability on SecurityLog using Prisma Client Extensions
export const prisma = basePrisma.$extends({
  query: {
    securityLog: {
      async update({ args, query }) {
        throw new Error('IMMUTABLE_SECURITY_LOG_VIOLATION: SecurityLog records are cryptographically append-only. UPDATE operations are strictly prohibited.');
      },
      async updateMany({ args, query }) {
        throw new Error('IMMUTABLE_SECURITY_LOG_VIOLATION: SecurityLog records are cryptographically append-only. UPDATE_MANY operations are strictly prohibited.');
      },
      async delete({ args, query }) {
        throw new Error('IMMUTABLE_SECURITY_LOG_VIOLATION: SecurityLog records are cryptographically append-only. DELETE operations are strictly prohibited.');
      },
      async deleteMany({ args, query }) {
        throw new Error('IMMUTABLE_SECURITY_LOG_VIOLATION: SecurityLog records are cryptographically append-only. DELETE_MANY operations are strictly prohibited.');
      }
    }
  }
});

export default prisma;
