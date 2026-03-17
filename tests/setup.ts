// tests/setup.ts
import { PrismaClient } from '@prisma/client';
import bcryptLib from 'bcryptjs';
import * as jwt from 'jsonwebtoken';

export const prisma = new PrismaClient();
export const JWT_SECRET = process.env.JWT_SECRET || 'test_secret';

export const TEST_USER = {
  email: 'test@example.com',
  password: 'password123',
  name: 'Test User',
  roleId: 1,
};

export const TEST_ADMIN = {
  email: 'admin@test.com',
  password: 'admin123',
  name: 'Admin',
  roleId: 2,
};

export const hashPassword = (password: string) => bcryptLib.hash(password, 10);
export const generateToken = (userId: number, roleId: number) => 
  jwt.sign({ userId, roleId }, JWT_SECRET);

// Простая очистка — только тестовые пользователи
export const cleanupDatabase = async () => {
  try {
    await prisma.user.deleteMany({
      where: { email: { in: [TEST_USER.email, TEST_ADMIN.email] } }
    });
  } catch (e) {
    // Игнорируем ошибки
  }
};