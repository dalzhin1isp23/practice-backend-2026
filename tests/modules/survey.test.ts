import request from 'supertest';
import { prisma, TEST_USER, generateToken, cleanupDatabase, hashPassword } from '../setup';
import { createTestSurvey, createSurveyWithQuestions, getAuthHeader } from '../utils/testHelpers';
import index from '../../src/index';

describe('📋 Survey Module', () => {
  let userToken: string;
  let userId: number;

  beforeAll(async () => {
    await cleanupDatabase();
    const user = await prisma.user.upsert({
      where: { email: TEST_USER.email },
      update: {},
      create: { 
        ...TEST_USER, 
        password: await hashPassword(TEST_USER.password) 
      },
    });
    userId = user.id;
    userToken = await generateToken(userId, TEST_USER.roleId, TEST_USER.email);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /api/surveys — Создание опроса', () => {
    it('должен создать опрос с вопросами', async () => {
      const res = await request(index)
        .post('/api/surveys')
        .set(getAuthHeader(userToken))
        .send({
          name: 'Мой опрос',
          description: 'Тест создания',
          questions: [
            {
              text: 'Ваш возраст?',
              typeId: 1,
              order: 1,
              options: [],
            },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.questions).toBeInstanceOf(Array);
    });
  });
});