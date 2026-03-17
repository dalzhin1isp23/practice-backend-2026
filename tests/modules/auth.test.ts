import request from 'supertest';
import { prisma, TEST_USER, TEST_ADMIN, generateToken, cleanupDatabase } from '../setup';
import index from '../../src/index';

describe('🔐 Auth Module', () => {
  beforeAll(async () => {
    await cleanupDatabase();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /api/auth/register', () => {
    it('должен зарегистрировать нового пользователя', async () => {
      const res = await request(index)
        .post('/api/auth/register')
        .send({
          email: 'newuser@test.com',
          password: 'secure123',
          name: 'New User',
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('userId');
      expect(res.body.message).toBe('Пользователь создан');
    });

    it('должен отклонить регистрацию с занятым email', async () => {
      // Сначала регистрируем
      await request(index)
        .post('/api/auth/register')
        .send({
          email: 'duplicate@test.com',
          password: 'pass123',
          name: 'First',
        });

      // Пытаемся снова с тем же email
      const res = await request(index)
        .post('/api/auth/register')
        .send({
          email: 'duplicate@test.com',
          password: 'pass456',
          name: 'Second',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Email уже занят');
    });
  });

  describe('POST /api/auth/login', () => {
    it('должен выдать токен при правильных данных', async () => {
      // Создаём пользователя
      await request(index)
        .post('/api/auth/register')
        .send({
          email: 'login@test.com',
          password: 'loginpass',
          name: 'Login Test',
        });

      const res = await request(index)
        .post('/api/auth/login')
        .send({
          email: 'login@test.com',
          password: 'loginpass',
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
    });

    it('должен отклонить неверный пароль', async () => {
      const res = await request(index)
        .post('/api/auth/login')
        .send({
          email: 'login@test.com',
          password: 'wrongpassword',
        });

      expect(res.status).toBe(401);
      expect(res.body.error).toContain('Неверные учетные данные');
    });
  });

  describe('GET /api/profile', () => {
    it('должен вернуть профиль авторизованного пользователя', async () => {
      const user = await prisma.user.findFirst({ where: { email: TEST_USER.email } });
      if (!user) return;

      const token = generateToken(user.id, user.roleId);

      const res = await request(index)
        .get('/api/profile')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('email', TEST_USER.email);
      expect(res.body).toHaveProperty('name', TEST_USER.name);
    });

    it('должен отклонить запрос без токена', async () => {
      const res = await request(index).get('/api/profile');
      expect(res.status).toBe(401);
    });
  });
});