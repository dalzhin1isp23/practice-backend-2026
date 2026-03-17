// tests/utils/testHelpers.ts
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const createTestSurvey = async (authorId: number, overrides: any = {}) => {
  return prisma.survey.create({
    data: {
      name: 'Тестовый опрос',
      description: 'Описание для тестов',
      authorId,
      statusId: 1,
      ...overrides,
    },
    include: { questions: { include: { options: true } } },
  });
};

export const createSurveyWithQuestions = async (authorId: number, questions: any[]) => {
  return prisma.survey.create({
    data: {
      name: 'Опрос с вопросами',
      description: 'Тест',
      authorId,
      statusId: 2,
      questions: {
        create: questions.map((q: any, index: number) => ({
          text: q.text,
          typeId: q.typeId,
          order: index + 1,
          options: q.options?.length > 0 ? {
            create: q.options.map((opt: any, optIndex: number) => ({
              text: opt,
              order: optIndex + 1,
            })),
          } : undefined,
        })),
      },
    },
    include: { questions: { include: { options: true } } },
  });
};

export const getAuthHeader = (token: string) => ({
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json',
});