import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {

  const statuses = ['Черновик', 'Опубликован', 'Закрыт'];
  for (const name of statuses) {
    await prisma.status.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  const types = ['Текстовый ответ', 'Одиночный выбор', 'Множественный выбор'];
  for (const name of types) {
    await prisma.type.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  const statusList = await prisma.status.findMany();
  const typeList = await prisma.type.findMany();
  const password = await bcrypt.hash('password123', 10);
  const adminPassword = await bcrypt.hash('admin123', 10);


  const users = [];
  for (let i = 1; i <= 10; i++) {
    const user = await prisma.user.upsert({
      where: { email: `user${i}@example.com` },
      update: {},
      create: {
        email: `user${i}@example.com`,
        name: `Пользователь ${i}`,
        password: password,
        roleId: 1,
      },
    });
    users.push(user);
  }

  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Администратор',
      password: adminPassword,
      roleId: 2,
    },
  });
  console.log('Администратор создан: admin@example.com / admin123');


  const surveyConfigs = [
    {
      topic: 'Любимый язык программирования',
      questions: [
        {
          text: 'Какой язык вы используете чаще всего?',
          type: 'Одиночный выбор',
          options: ['JavaScript', 'Python', 'TypeScript', 'Java', 'Другой'],
        },
        {
          text: 'Какие языки вы изучали? (перечислите)',
          type: 'Текстовый ответ',
          options: [],
        },
        {
          text: 'Какие языки хотите изучить?',
          type: 'Множественный выбор',
          options: ['JavaScript', 'Python', 'TypeScript', 'Java', 'C#', 'Go', 'Rust'],
        },
      ],
    },
    {
      topic: 'Качество сна',
      questions: [
        {
          text: 'Сколько часов вы спите в среднем?',
          type: 'Одиночный выбор',
          options: ['Меньше 5', '5–6', '7–8', 'Больше 8'],
        },
        {
          text: 'Что мешает вам спать?',
          type: 'Множественный выбор',
          options: ['Стресс', 'Гаджеты', 'Шум', 'Кофеин', 'Ничего'],
        },
        {
          text: 'Ваши советы для улучшения сна',
          type: 'Текстовый ответ',
          options: [],
        },
      ],
    },
    {
      topic: 'Предпочтения в кофе',
      questions: [
        {
          text: 'Какой кофе вы предпочитаете?',
          type: 'Одиночный выбор',
          options: ['Эспрессо', 'Капучино', 'Латте', 'Американо', 'Не пью кофе'],
        },
        {
          text: 'Когда вы обычно пьёте кофе?',
          type: 'Множественный выбор',
          options: ['Утром', 'Днём', 'Вечером', 'Ночью'],
        },
      ],
    },
    {
      topic: 'Спорт и здоровье',
      questions: [
        {
          text: 'Как часто вы занимаетесь спортом?',
          type: 'Одиночный выбор',
          options: ['Ежедневно', '2–3 раза в неделю', 'Раз в неделю', 'Редко', 'Никогда'],
        },
        {
          text: 'Какие виды активности вы предпочитаете?',
          type: 'Множественный выбор',
          options: ['Бег', 'Зал', 'Йога', 'Плавание', 'Велоспорт', 'Домашние тренировки'],
        },
        {
          text: 'Ваши цели в спорте',
          type: 'Текстовый ответ',
          options: [],
        },
      ],
    },
    {
      topic: 'Удаленная работа',
      questions: [
        {
          text: 'Насколько вы продуктивны дома?',
          type: 'Одиночный выбор',
          options: ['Очень', 'Скорее да', 'Нейтрально', 'Скорее нет', 'Нет'],
        },
        {
          text: 'Что вам нравится в удалёнке?',
          type: 'Множественный выбор',
          options: ['Гибкий график', 'Нет дороги', 'Комфорт', 'Экономия', 'Ничего'],
        },
      ],
    },
    {
      topic: 'Путешествия мечты',
      questions: [
        {
          text: 'Какой тип отдыха вы предпочитаете?',
          type: 'Одиночный выбор',
          options: ['Пляжный', 'Горный', 'Городской', 'Экотуризм', 'Приключения'],
        },
        {
          text: 'С кем вы любите путешествовать?',
          type: 'Множественный выбор',
          options: ['Один', 'С семьёй', 'С друзьями', 'С партнёром', 'В группе'],
        },
        {
          text: 'Куда мечтаете поехать?',
          type: 'Текстовый ответ',
          options: [],
        },
      ],
    },
    {
      topic: 'Кино и сериалы',
      questions: [
        {
          text: 'Что вы смотрите чаще?',
          type: 'Одиночный выбор',
          options: ['Фильмы', 'Сериалы', 'Документалки', 'Аниме', 'Ничего'],
        },
        {
          text: 'Какие жанры вам нравятся?',
          type: 'Множественный выбор',
          options: ['Драма', 'Комедия', 'Фантастика', 'Ужасы', 'Детектив', 'Романтика'],
        },
      ],
    },
    {
      topic: 'Использование ИИ',
      questions: [
        {
          text: 'Как часто вы используете ИИ-инструменты?',
          type: 'Одиночный выбор',
          options: ['Ежедневно', 'Раз в неделю', 'Раз в месяц', 'Редко', 'Никогда'],
        },
        {
          text: 'Для чего вы применяете ИИ?',
          type: 'Множественный выбор',
          options: ['Код', 'Тексты', 'Дизайн', 'Анализ', 'Обучение', 'Развлечения'],
        },
        {
          text: 'Ваши опасения насчёт ИИ',
          type: 'Текстовый ответ',
          options: [],
        },
      ],
    },
    {
      topic: 'Чтение книг',
      questions: [
        {
          text: 'В каком формате вы читаете?',
          type: 'Одиночный выбор',
          options: ['Бумажные', 'Электронные', 'Аудиокниги', 'Не читаю'],
        },
        {
          text: 'Какие жанры вы предпочитаете?',
          type: 'Множественный выбор',
          options: ['Фантастика', 'Нон-фикшн', 'Детективы', 'Классика', 'Саморазвитие', 'Фэнтези'],
        },
      ],
    },
    {
      topic: 'Видеоигры',
      questions: [
        {
          text: 'На какой платформе вы играете?',
          type: 'Одиночный выбор',
          options: ['PC', 'PlayStation', 'Xbox', 'Nintendo', 'Мобильные', 'Не играю'],
        },
        {
          text: 'Какие жанры вам нравятся?',
          type: 'Множественный выбор',
          options: ['RPG', 'Шутеры', 'Стратегии', 'Инди', 'Спортивные', 'Головоломки'],
        },
        {
          text: 'Ваша любимая игра',
          type: 'Текстовый ответ',
          options: [],
        },
      ],
    },
  ];


  for (let i = 0; i < 10; i++) {
    const config = surveyConfigs[i];
    const randomAuthor = users[Math.floor(Math.random() * users.length)];
    
    let randomStatus;
    if (i < 4) randomStatus = statusList.find(s => s.name === 'Опубликован');
    else if (i < 7) randomStatus = statusList.find(s => s.name === 'Закрыт');
    else randomStatus = statusList.find(s => s.name === 'Черновик');

    const questionsData = config.questions.map((q, qIndex) => {
      const type = typeList.find(t => t.name === q.type);
      return {
        text: q.text,
        typeId: type!.id,
        order: qIndex + 1,
        options: {
          create: q.options.map((optText, oIndex) => ({
            text: optText,
            order: oIndex + 1,
          })),
        },
      };
    });

    const survey = await prisma.survey.create({
      data: {
        name: config.topic,
        description: `Опрос на тему: ${config.topic}. Помогите нам узнать ваше мнение!`,
        statusId: randomStatus!.id,
        authorId: randomAuthor.id,
        questions: {
          create: questionsData,
        },
      },
      include: {
        questions: {
          include: { options: true },
        },
      },
    });

    if (randomStatus!.name === 'Опубликован' || randomStatus!.name === 'Закрыт') {
      const potentialVoters = users.filter(u => u.id !== randomAuthor.id);
      const votersCount = Math.floor(Math.random() * 3) + 3;
      const selectedVoters = potentialVoters
        .sort(() => 0.5 - Math.random())
        .slice(0, votersCount);

      for (const voter of selectedVoters) {
        const existingVote = await prisma.vote.findFirst({
          where: {
            surveyId: survey.id,
            userId: voter.id,
          },
        });
        if (existingVote) continue;

        const answers = [];
        for (const question of survey.questions) {
          const questionType = typeList.find(t => t.id === question.typeId);
          const typeName = questionType?.name;

          if (typeName === 'Текстовый ответ') {
      
            answers.push({
              questionId: question.id,
              text: `Ответ пользователя на вопрос "${question.text}"`,
            });
          } else if (typeName === 'Множественный выбор') {

            const selectedOptions = question.options
              .sort(() => 0.5 - Math.random())
              .slice(0, Math.floor(Math.random() * 3) + 1);
            
            answers.push({
              questionId: question.id,
              optionIds: selectedOptions.map(o => o.id),
              text: selectedOptions.map(o => o.text).join(', '),
            });
          } else {

            const randomOption = question.options[Math.floor(Math.random() * question.options.length)];
            answers.push({
              questionId: question.id,
              optionId: randomOption.id,
              text: randomOption.text,
            });
          }
        }

        await prisma.vote.create({
          data: {
            surveyId: survey.id,
            userId: voter.id,
            answer: answers,
          },
        }).catch(() => {});
      }
    }
  }

  console.log(' Сидер завершён');
  console.log(' Типы вопросов: 1=Текст, 2=Одиночный выбор, 3=Множественный выбор');
}

main()
  .catch((e) => {
    console.error('Ошибка при сиде:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });