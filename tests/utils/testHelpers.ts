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
    include: {
      question: {
        include: { option: true, type: true },
        orderBy: { order: 'asc' }
      },
      user: { select: { id: true, email: true, name: true } },
      status: true,
    },
  });
};

export const createSurveyWithQuestions = async (
  authorId: number,
  questions: Array<{
    text: string;
    typeId: number;
    options?: string[];
  }>
) => {
  return prisma.survey.create({
    data: {
      name: 'Опрос с вопросами',
      description: 'Тест',
      authorId,
      statusId: 2,
      question: {
        create: questions.map((q, index) => ({
          text: q.text,
          typeId: q.typeId,
          order: index + 1,
          option: q.options?.length
            ? {
                create: q.options.map((opt, optIndex) => ({
                  text: opt,
                  order: optIndex + 1,
                })),
              }
            : undefined,
        })),
      },
    },
    include: {
      question: {
        include: { option: true },
        orderBy: { order: 'asc' }
      }
    },
  });
};

export const getAuthHeader = (token: string) => ({
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json',
});