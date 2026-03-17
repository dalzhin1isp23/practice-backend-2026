// src/function/survey.ts
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const getMySurveys = async (req: any, res: any) => {
  const authorId = req.user.userId;
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  try {
    const [surveys, total] = await Promise.all([
      prisma.survey.findMany({
        where: { authorId },
        include: {
          status: true,
          _count: { select: { questions: true, votes: true } }
        },
        orderBy: { id: 'desc' },
        skip,
        take: limit
      }),
      prisma.survey.count({ where: { authorId } })
    ]);

    res.json({
      data: surveys,
      meta: { total, page, lastPage: Math.ceil(total / limit) }
    });
  } catch (error) {
    res.status(500).json({ error: "Ошибка при получении списка опросов" });
  }
};

export const createSurvey = async (req: any, res: any) => {
  if (req.user.roleId === 2) {
    return res.status(403).json({ error: "Администраторы не могут создавать опросы" });
  }

  const { name, description, questions } = req.body;
  const authorId = req.user.userId;

  try {
    const TEXT_TYPE_ID = 1;

    for (const q of questions) {
      if (q.typeId === TEXT_TYPE_ID && q.options && q.options.length > 0) {
        return res.status(400).json({ error: "К текстовому вопросу нельзя добавлять варианты ответов" });
      }
      if (q.typeId !== TEXT_TYPE_ID && (!q.options || q.options.length === 0)) {
        return res.status(400).json({ error: "К вопросу с выбором необходимо добавить варианты ответов" });
      }
    }

    const newSurvey = await prisma.survey.create({
      data: {  // ✅ ПРАВИЛЬНО: ключ `data`
        name,
        description,
        authorId,
        statusId: 1,
        questions: {
          create: questions.map((q: any) => ({
            text: q.text,
            typeId: q.typeId,
            order: q.order,
            options: {
              create: q.options.map((opt: any) => ({
                text: opt.text,
                order: opt.order
              }))
            }
          }))
        }
      }
    });
    res.status(201).json(newSurvey);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: "Ошибка при создании опроса" });
  }
};

export const publishSurvey = async (req: any, res: any) => {
  const { id } = req.params;
  const authorId = req.user.userId;

  try {
    const survey = await prisma.survey.findUnique({ where: { id: Number(id) } });
    if (!survey || survey.authorId !== authorId) return res.status(403).json({ error: "Доступ запрещен" });

    await prisma.survey.update({
      where: { id: Number(id) },
      data: { statusId: 2 }  // ✅ ПРАВИЛЬНО: ключ `data`
    });
    res.json({ message: "Опрос опубликован" });
  } catch (error) {
    res.status(404).json({ error: "Опрос не найден" });
  }
};

export const closeSurvey = async (req: any, res: any) => {
  const { id } = req.params;
  const authorId = req.user.userId;

  try {
    const survey = await prisma.survey.findUnique({ where: { id: Number(id) } });
    if (!survey || survey.authorId !== authorId) return res.status(403).json({ error: "Доступ запрещен" });

    await prisma.survey.update({
      where: { id: Number(id) },
      data: { statusId: 3 }  // ✅ ПРАВИЛЬНО: ключ `data`
    });
    res.json({ message: "Опрос закрыт" });
  } catch (error) {
    res.status(400).json({ error: "Не удалось закрыть опрос" });
  }
};

export const deleteSurvey = async (req: any, res: any) => {
  const { id } = req.params;
  const authorId = req.user.userId;

  try {
    const survey = await prisma.survey.findUnique({ where: { id: Number(id) } });
    if (!survey || survey.authorId !== authorId) return res.status(403).json({ error: "Доступ запрещен" });

    await prisma.survey.delete({ where: { id: Number(id) } });
    res.json({ message: "Опрос удален" });
  } catch (error) {
    res.status(400).json({ error: "Ошибка при удалении" });
  }
};

export const getAllPublicSurveys = async (req: any, res: any) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  try {
    const statusFilter = req.query.status;
    const sortBy = req.query.sortBy || 'id';
    const sortOrder = req.query.sortOrder === 'asc' ? 'asc' : 'desc';

    const whereCondition: any = {
      NOT: { authorId: req.user.userId }
    };

    if (statusFilter === 'active') whereCondition.statusId = 2;
    else if (statusFilter === 'closed') whereCondition.statusId = 3;
    else if (statusFilter !== 'all') whereCondition.statusId = 2;

    const orderBy: any = {};
    if (sortBy === 'votesCount') {
      orderBy.votes = { _count: sortOrder };
    } else {
      orderBy[sortBy] = sortOrder;
    }

    const [surveys, total] = await Promise.all([
      prisma.survey.findMany({
        where: whereCondition,
        include: {
          author: { select: { name: true } },
          _count: { select: { votes: true } }
        },
        orderBy,
        skip,
        take: limit
      }),
      prisma.survey.count({ where: whereCondition })
    ]);

    res.json({
      data: surveys,
      meta: { total, page, lastPage: Math.ceil(total / limit) }
    });
  } catch (error) {
    res.status(500).json({ error: "Ошибка при получении списка опросов" });
  }
};

export const getSurveyById = async (req: any, res: any) => {
  try {
    const survey = await prisma.survey.findFirst({
      where: { id: Number(req.params.id), statusId: 2 },
      include: { questions: { include: { options: true } } }
    });
    survey ? res.json(survey) : res.status(404).json({ error: "Опрос не найден" });
  } catch (error) {
    res.status(500).json({ error: "Ошибка при получении опроса" });
  }
};

export const getSurveyByName = async (req: any, res: any) => {
  try {
    const survey = await prisma.survey.findFirst({
      where: { name: { contains: req.params.name }, statusId: 2 },
      include: { questions: { include: { options: true } } }
    });
    res.json(survey);
  } catch (error) {
    res.status(500).json({ error: "Ошибка при поиске опроса" });
  }
};

export const getSurveyStatus = async (req: any, res: any) => {
  try {
    const vote = await prisma.vote.findUnique({
      where: { surveyId_userId: { surveyId: Number(req.params.id), userId: req.user.userId } }
    });
    res.json({ completed: !!vote });
  } catch (error) {
    res.status(500).json({ error: "Ошибка при проверке статуса" });
  }
};

export const updateSurvey = async (req: any, res: any) => {
  const { id } = req.params;
  const { name, description } = req.body;

  try {
    const survey = await prisma.survey.findUnique({ where: { id: Number(id) } });
    if (survey?.authorId !== req.user.userId || survey.statusId !== 1) {
      return res.status(403).json({ error: "Редактировать можно только свои черновики" });
    }

    const updated = await prisma.survey.update({
      where: { id: Number(id) },
      data: { name, description }  // ✅ ПРАВИЛЬНО: ключ `data`
    });
    res.json(updated);
  } catch (e) {
    res.status(400).json({ error: "Ошибка обновления" });
  }
};

export const submitVote = async (req: any, res: any) => {
  const { id } = req.params;
  const { answers } = req.body;
  const userId = req.user.userId;

  try {
    const survey = await prisma.survey.findUnique({
      where: { id: Number(id) },
      include: { questions: { include: { options: true } } }
    });

    if (!survey || survey.statusId !== 2) {
      return res.status(400).json({ error: "Опрос недоступен для прохождения" });
    }

    const existingVote = await prisma.vote.findUnique({
      where: {
        surveyId_userId: {
          surveyId: Number(id),
          userId: userId
        }
      }
    });

    if (existingVote) {
      return res.status(400).json({ error: "Вы уже проходили этот опрос" });
    }

    const TEXT_TYPE_ID = 1;
    const SINGLE_CHOICE_TYPE_ID = 2;
    const MULTIPLE_CHOICE_TYPE_ID = 3;

    for (const answer of answers) {
      const question = survey.questions.find((q: any) => q.id === answer.questionId);
      if (!question) {
        return res.status(400).json({ error: `Вопрос ${answer.questionId} не найден` });
      }

      if (question.typeId === TEXT_TYPE_ID) {
        if (!answer.text || answer.optionId) {
          return res.status(400).json({ error: "Для текстового вопроса необходимо поле text" });
        }
      } else if (question.typeId === SINGLE_CHOICE_TYPE_ID) {
        if (!answer.optionId || Array.isArray(answer.optionId)) {
          return res.status(400).json({ error: "Для одиночного выбора необходимо указать один optionId" });
        }
      } else if (question.typeId === MULTIPLE_CHOICE_TYPE_ID) {
        if (!answer.optionIds || !Array.isArray(answer.optionIds)) {
          return res.status(400).json({ error: "Для множественного выбора необходимо указать optionIds (массив)" });
        }
      }
    }

    const newVote = await prisma.vote.create({
      data: {  // ✅ ПРАВИЛЬНО: ключ `data`
        surveyId: Number(id),
        userId: userId,
        answer: answers
      }
    });

    res.status(201).json({ message: "Ответы успешно сохранены", voteId: newVote.id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Ошибка при отправке ответов" });
  }
};

export const getSurveyResponses = async (req: any, res: any) => {
  const { id } = req.params;
  const authorId = req.user.userId;

  try {
    const survey = await prisma.survey.findUnique({
      where: { id: Number(id) },
      include: { questions: true }
    });

    if (!survey || survey.authorId !== authorId)
      return res.status(403).json({ error: "Доступ запрещен" });

    const votes = await prisma.vote.findMany({
      where: { surveyId: Number(id) },
      include: { user: { select: { name: true, email: true } } }
    });

    const formattedResponses = votes.map(vote => {
      const answers = Array.isArray(vote.answer) ? vote.answer : [];
      const textAnswers = answers
        .filter((a: any) => a.text)
        .map((a: any) => ({
          questionId: a.questionId,
          answerText: a.text
        }));

      return {
        userId: vote.userId,
        userName: vote.user?.name,
        userEmail: vote.user?.email,
        answers: textAnswers
      };
    });

    res.json({
      totalResponses: formattedResponses.length,
      data: formattedResponses
    });
  } catch (error) {
    res.status(500).json({ error: "Ошибка при получении ответов" });
  }
};

export const exportSurveyResults = async (req: any, res: any) => {
  const { id } = req.params;
  const authorId = req.user.userId;

  try {
    const survey = await prisma.survey.findUnique({
      where: { id: Number(id) },
      include: {
        questions: { include: { options: true } },
        votes: true
      }
    });

    if (!survey || survey.authorId !== authorId) return res.status(403).json({ error: "Доступ запрещен" });
    res.json(survey);
  } catch (error) {
    res.status(500).json({ error: "Ошибка при экспорте результатов" });
  }
};

export const getSurveyAnalytics = async (req: any, res: any) => {
  const { id } = req.params;

  try {
    const survey = await prisma.survey.findUnique({
      where: { id: Number(id) },
      include: {
        questions: {
          include: { options: true }
        },
        votes: true
      }
    });

    if (!survey) return res.status(404).json({ error: "Опрос не найден" });

    const totalVotes = survey.votes.length;

    const stats = survey.questions.map(question => {
      const questionAnswers = survey.votes.map((v: any) => v.answer).flat();

      const optionsStats = question.options.map(opt => {
        const count = questionAnswers.filter((a: any) =>
          a.questionId === question.id && (a.optionId === opt.id || a.optionIds?.includes(opt.id))
        ).length;

        return {
          optionText: opt.text,
          count,
          percentage: totalVotes > 0 ? ((count / totalVotes) * 100).toFixed(1) + '%' : '0%'
        };
      });

      return {
        questionText: question.text,
        typeId: question.typeId,
        results: optionsStats
      };
    });

    res.json({
      surveyName: survey.name,
      totalParticipants: totalVotes,
      analytics: stats
    });
  } catch (error) {
    res.status(500).json({ error: "Ошибка при расчете аналитики" });
  }
};