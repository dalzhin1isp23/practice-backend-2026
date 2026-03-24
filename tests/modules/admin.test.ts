import request from 'supertest';
import { prisma, TEST_ADMIN, TEST_USER, generateToken, cleanupDatabase, hashPassword } from '../setup';
import { createTestSurvey, getAuthHeader } from '../utils/testHelpers';
import index from '../../src/index';

describe('👮 Admin Module', () => {
  let adminToken: string;
  let adminId: number;
  let userId: number;

  beforeAll(async () => {
    await cleanupDatabase();
    
    const admin = await prisma.user.upsert({
      where: { email: TEST_ADMIN.email },
      update: {},
      create: { 
        ...TEST_ADMIN, 
        password: await hashPassword(TEST_ADMIN.password)
      },
    });
    adminId = admin.id;
    adminToken = await generateToken(adminId, TEST_ADMIN.roleId, TEST_ADMIN.email);

    const user = await prisma.user.upsert({
      where: { email: TEST_USER.email },
      update: {},
      create: { 
        ...TEST_USER, 
        password: await hashPassword(TEST_USER.password)
      },
    });
    userId = user.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
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
      const userToken = await generateToken(userId, TEST_USER.roleId, TEST_USER.email);
      
      const res = await request(index)
        .get('/api/admin/surveys')
        .set(getAuthHeader(userToken));

      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/доступ|админ|forbidden/i);
    });

    it('должен отклонить запрос без токена', async () => {
      const res = await request(index).get('/api/admin/surveys');
      expect(res.status).toBe(401);
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
          questions: [
            {
              text: 'Тестовый вопрос?',
              typeId: 1,
              order: 1,
              options: [],
            },
          ],
        });

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('Администраторы не могут создавать опросы');
    });
  });
});