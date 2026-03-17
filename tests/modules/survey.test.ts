import request from 'supertest';
import { prisma, TEST_USER, generateToken, cleanupDatabase } from '../setup';
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
      create: { ...TEST_USER, password: 'hashed' },
    });
    userId = user.id;
    userToken = generateToken(userId, 1);
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
            {
              text: 'Любимый цвет?',
              typeId: 2,
              order: 2,
              options: [
                { text: 'Красный', order: 1 },
                { text: 'Синий', order: 2 },
              ],
            },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.name).toBe('Мой опрос');
    });

    it('должен отклонить варианты у текстового вопроса', async () => {
      const res = await request(index)
        .post('/api/surveys')
        .set(getAuthHeader(userToken))
        .send({
          name: 'Bad Survey',
          description: 'Тест',
          questions: [{
            text: 'Комментарий',
            typeId: 1,
            order: 1,
            options: [{ text: 'Bad', order: 1 }],
          }],
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('нельзя добавлять варианты');
    });

    it('должен отклонить вопрос с выбором без вариантов', async () => {
      const res = await request(index)
        .post('/api/surveys')
        .set(getAuthHeader(userToken))
        .send({
          name: 'Bad Survey 2',
          description: 'Тест',
          questions: [{
            text: 'Выберите',
            typeId: 2,
            order: 1,
            options: [],
          }],
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('необходимо добавить варианты');
    });
  });

  describe('GET /api/surveys/my — Мои опросы', () => {
    it('должен вернуть список опросов автора', async () => {
      await createTestSurvey(userId);

      const res = await request(index)
        .get('/api/surveys/my')
        .set(getAuthHeader(userToken));

      expect(res.status).toBe(200);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body).toHaveProperty('meta');
    });
  });

  describe('POST /api/surveys/:id/submit — Прохождение опроса', () => {
    let surveyId: number;
    let questionId: number;

    beforeAll(async () => {
      const survey = await createSurveyWithQuestions(userId, [
        {
          text: 'Вопрос?',
          typeId: 2,
          options: ['Да', 'Нет'],
        },
      ]);
      surveyId = survey.id;
      const question = await prisma.question.findFirst({ where: { surveyId: survey.id } });
      questionId = question?.id || 0;
    });

    it('должен разрешить первое прохождение', async () => {
      const res = await request(index)
        .post(`/api/surveys/${surveyId}/submit`)
        .set(getAuthHeader(userToken))
        .send({
          answers: [{ questionId, optionId: 1, text: 'Да' }],
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('voteId');
    });

    it('должен отклонить повторное прохождение', async () => {
      const res = await request(index)
        .post(`/api/surveys/${surveyId}/submit`)
        .set(getAuthHeader(userToken))
        .send({
          answers: [{ questionId, optionId: 2, text: 'Нет' }],
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('уже проходили');
    });

    it('должен отклонить optionId для текстового вопроса', async () => {
      const textSurvey = await createSurveyWithQuestions(userId, [
        { text: 'Ваш ответ', typeId: 1, options: [] },
      ]);
      const textQuestion = await prisma.question.findFirst({ where: { surveyId: textSurvey.id } });
      const textQuestionId = textQuestion?.id || 0;

      const res = await request(index)
        .post(`/api/surveys/${textSurvey.id}/submit`)
        .set(getAuthHeader(userToken))
        .send({
          answers: [{ questionId: textQuestionId, optionId: 999 }],
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('text');
    });
  });

  describe('PATCH /api/surveys/:id — Редактирование', () => {
    it('должен запретить редактирование опубликованного опроса', async () => {
      const published = await createTestSurvey(userId, { statusId: 2 });

      const res = await request(index)
        .patch(`/api/surveys/${published.id}`)
        .set(getAuthHeader(userToken))
        .send({ name: 'Новое имя' });

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('черновики');
    });

    it('должен разрешить редактирование черновика', async () => {
      const draft = await createTestSurvey(userId, { statusId: 1 });

      const res = await request(index)
        .patch(`/api/surveys/${draft.id}`)
        .set(getAuthHeader(userToken))
        .send({ name: 'Обновлённый черновик' });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Обновлённый черновик');
    });
  });
});