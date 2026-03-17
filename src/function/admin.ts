import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const verifyAdmin = (req: any, res: any, next: any) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Требуется авторизация' });
  }


  const ADMIN_ROLE_ID = 2; 

  if (req.user.roleId !== ADMIN_ROLE_ID) {
    return res.status(403).json({ error: 'Доступ запрещен. Требуются права администратора.' });
  }

  next();
};


export const getAllSurveysAdmin = async (req: any, res: any) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const whereCondition = {}; 

    const [surveys, total] = await Promise.all([
      prisma.survey.findMany({
        where: whereCondition,
        include: { 
          author: { select: { id: true, name: true, email: true } },
          status: { select: { name: true } },
          _count: { select: { votes: true, questions: true } }
        },
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
    console.error(error);
    res.status(500).json({ error: "Ошибка при получении списка опросов администратором" });
  }
};


export const deleteSurveyAdmin = async (req: any, res: any) => {
  const { id } = req.params;

  try {
    const surveyId = Number(id);
    
    const survey = await prisma.survey.findUnique({ where: { id: surveyId } });
    if (!survey) {
      return res.status(404).json({ error: "Опрос не найден" });
    }

    await prisma.survey.delete({
      where: { id: surveyId }
    });

    res.json({ message: "Опрос успешно удален администратором", deletedId: surveyId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Ошибка при удалении опроса" });
  }
};

export const updateSurveyStatusAdmin = async (req: any, res: any) => {
  const { id } = req.params;
  const { statusId } = req.body;

  try {
    const surveyId = Number(id);
    const newStatusId = Number(statusId);

    if (!newStatusId) {
      return res.status(400).json({ error: "Необходимо указать statusId" });
    }

    const survey = await prisma.survey.findUnique({ where: { id: surveyId } });
    if (!survey) {
      return res.status(404).json({ error: "Опрос не найден" });
    }

    const updated = await prisma.survey.update({
      where: { id: surveyId },
      data: { statusId: newStatusId }
    });

    res.json({ 
      message: "Статус опроса изменен администратором", 
      survey: updated 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Ошибка при обновлении статуса" });
  }
};

