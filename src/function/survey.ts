import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();


export const getMySurveys = async (req: any, res: any) => {
  const authorId = req.user.userId;
  const surveys = await prisma.survey.findMany({
    where: { authorId },
    include: { 
      status: true, 
      _count: { select: { questions: true } } 
    }
  });
  res.json(surveys);
};


export const createSurvey = async (req: any, res: any) => {
  const { name, description, questions } = req.body;
  const authorId = req.user.userId;

  try {
    const newSurvey = await prisma.survey.create({
      data: {
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
      data: { statusId: 2 }
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
      data: { statusId: 3 }
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
  const surveys = await prisma.survey.findMany({
    where: { statusId: 2, NOT: { authorId: req.user.userId } },
    include: { author: { select: { name: true } } }
  });
  res.json(surveys);
};

export const getSurveyById = async (req: any, res: any) => {
  const survey = await prisma.survey.findFirst({
    where: { id: Number(req.params.id), statusId: 2 },
    include: { questions: { include: { options: true } } }
  });
  survey ? res.json(survey) : res.status(404).json({ error: "Опрос не найден" });
};

export const getSurveyByName = async (req: any, res: any) => {
  const survey = await prisma.survey.findFirst({
    where: { name: { contains: req.params.name }, statusId: 2 },
    include: { questions: { include: { options: true } } }
  });
  res.json(survey);
};

export const getSurveyStatus = async (req: any, res: any) => {
  const vote = await prisma.vote.findUnique({
    where: { surveyId_userId: { surveyId: Number(req.params.id), userId: req.user.userId } }
  });
  res.json({ completed: !!vote });
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
      data: { name, description }
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
      where: { id: Number(id) }
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

  
    const newVote = await prisma.vote.create({
      data: {
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

  const survey = await prisma.survey.findUnique({ where: { id: Number(id) } });
  if (!survey || survey.authorId !== authorId) return res.status(403).json({ error: "Доступ запрещен" });

  const votes = await prisma.vote.findMany({
    where: { surveyId: Number(id) },
    include: { user: { select: { name: true, email: true } } }
  });
  res.json(votes);
};

export const exportSurveyResults = async (req: any, res: any) => {
  const { id } = req.params;
  const authorId = req.user.userId;

  const survey = await prisma.survey.findUnique({
    where: { id: Number(id) },
    include: { 
      questions: { include: { options: true } },
      votes: true 
    }
  });

  if (!survey || survey.authorId !== authorId) return res.status(403).json({ error: "Доступ запрещен" });
  res.json(survey);
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

export const getAllPublicSurveys = async (req: any, res: any) => {

  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const surveys = await prisma.survey.findMany({
    where: { 
      statusId: 2, 
      NOT: { authorId: req.user.userId } 
    },
    include: { author: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
    skip: skip,
    take: limit
  });

  const total = await prisma.survey.count({ where: { statusId: 2 } });

  res.json({
    data: surveys,
    meta: {
      total,
      page,
      lastPage: Math.ceil(total / limit)
    }
  });
};
export const getAllPublicSurveys = async (req: any, res: any) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  try {
    const whereCondition = { 
      statusId: 2, 
      NOT: { authorId: req.user.userId } 
    };

    const [surveys, total] = await Promise.all([
      prisma.survey.findMany({
        where: whereCondition,
        include: { author: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.survey.count({ where: whereCondition })
]);

    res.json({
      data: surveys,
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: "Ошибка при получении списка опросов" });
  }
};

  const total = await prisma.survey.count({ where: { statusId: 2 } });

  res.json({
    data: surveys,
    meta: {
      total,
      page,
      lastPage: Math.ceil(total / limit)
    }
  });
};