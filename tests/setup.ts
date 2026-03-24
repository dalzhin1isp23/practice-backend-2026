import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
export { prisma };

export const TEST_USER = {
  email: 'testuser@example.com',
  password: 'password123',
  name: 'Test User',
  roleId: 2,
};

export const TEST_ADMIN = {
  email: 'admin@example.com',
  password: 'admin123',
  name: 'Admin User',
  roleId: 1,
};

export const hashPassword = async (password: string): Promise<string> => {
  const bcrypt = await import('bcryptjs');
  return bcrypt.default.hash(password, 10);
};

export const generateToken = async (userId: number, roleId: number, email?: string) => {
  const jwtModule = await import('jsonwebtoken');
  const jwt = jwtModule.default;
  return jwt.sign({ userId, roleId, email }, process.env.JWT_SECRET || 'test_secret', {
    expiresIn: '1h',
  });
};

export const cleanupDatabase = async () => {
  try { await prisma.answer.deleteMany(); } catch {}
  try { await prisma.questionOption.deleteMany(); } catch {}
  try { await prisma.question.deleteMany(); } catch {}
  try { await prisma.survey.deleteMany(); } catch {}
  try { await prisma.user.deleteMany(); } catch {}
  try { await prisma.role.deleteMany(); } catch {}
};