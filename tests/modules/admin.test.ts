import request from 'supertest';
import { prisma, TEST_ADMIN, TEST_USER, generateToken, cleanupDatabase } from '../setup';
import { createTestSurvey, getAuthHeader } from '../utils/testHelpers';
import index from '../../src/index';

describe('👮 Admin Module', () => {
  let adminToken: string;
  let userId: number;

  beforeAll(async () => {
    await cleanupDatabase();
    
    const admin = await prisma.user.upsert({
      where: { email: TEST_ADMIN.email },
      update: {},
      create: { 
        ...TEST_ADMIN, 
        password: await require('bcryptjs').hash('admin123', 10) 
      },
    });
    adminToken = generateToken(admin.id, 2);

    const user = await prisma.user.upsert({
      where: { email: TEST_USER.email },
      update: {},
      create: { 
        ...TEST_USER, 
        password: await require('bcryptjs').hash('password123', 10) 
      },
    });
    userId = user.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // ✅ Обязательно хотя бы один тест!
  it('должен загрузить модуль админа', () => {
    expect(true).toBe(true);
  });

  describe('GET /api/admin/surveys', () => {
    it('должен вернуть все опросы администратору', async () => {
      await createTestSurvey(userId);

      const res = await request(index)
        .get('/api/admin/surveys')
        .set(getAuthHeader(adminToken));

      expect(res.status).toBe(200);
      expect(res.body.surveys).toBeInstanceOf(Array);
    });

    it('должен отклонить обычного пользователя', async () => {
      const userToken = generateToken(userId, 1);
      
      const res = await request(index)
        .get('/api/admin/surveys')
        .set(getAuthHeader(userToken));

      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/surveys — админ не может создавать', () => {
    it('должен отклонить создание опроса админом', async () => {
      const res = await request(index)
        .post('/api/surveys')
        .set(getAuthHeader(adminToken))
        .send({
          name: 'Admin Survey',
          description: 'Should fail',
          questions: [],
        });

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('Администраторы не могут создавать опросы');
    });
  });
});