export const starts = (req: any, res: any) => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  
  const routes = {
    api: {
      version: '1.0.0',
      baseUrl: baseUrl,
      documentation: `${baseUrl}/api-docs`,
      

      auth: [
        {
          method: 'POST',
          path: '/api/auth/register',
          description: 'Регистрация нового пользователя',
          auth: false,
          body: {
            email: 'string (required)',
            password: 'string (min 6)',
            name: 'string (optional)'
          },
          response: { token: 'string', user: 'object' }
        },
        {
          method: 'POST',
          path: '/api/auth/login',
          description: 'Вход в систему',
          auth: false,
          body: {
            email: 'string (required)',
            password: 'string (required)'
          },
          response: { token: 'string', user: 'object' }
        },
        {
          method: 'POST',
          path: '/api/auth/logout',
          description: 'Выход (инвалидация токена на клиенте)',
          auth: false,
          response: { msg: 'string' }
        }
      ],
      
      profile: [
        {
          method: 'GET',
          path: '/api/profile',
          description: 'Получение данных профиля',
          auth: true,
          headers: { 'Authorization': 'Bearer <token>' },
          response: { id: 'number', email: 'string', name: 'string', role: 'string' }
        },
        {
          method: 'PATCH',
          path: '/api/profile',
          description: 'Обновление профиля',
          auth: true,
          headers: { 'Authorization': 'Bearer <token>' },
          body: { name: 'string', email: 'string' },
          response: { message: 'string', user: 'object' }
        }
      ],
      
  
      surveys: [
        {
          method: 'GET',
          path: '/api/surveys',
          description: 'Получение всех публичных опросов',
          auth: true,
          query: { page: 'number', limit: 'number', status: 'draft|published|closed' },
          response: { surveys: 'array', total: 'number', page: 'number' }
        },
        {
          method: 'GET',
          path: '/api/surveys/:id',
          description: 'Получение опроса по ID',
          auth: true,
          params: { id: 'number (required)' },
          response: { survey: 'object' }
        },
        {
          method: 'GET',
          path: '/api/surveys/search/:name',
          description: 'Поиск опроса по названию',
          auth: true,
          params: { name: 'string' },
          response: { surveys: 'array' }
        },
        {
          method: 'POST',
          path: '/api/surveys/:id/submit',
          description: 'Отправка голоса в опрос',
          auth: true,
          params: { id: 'number' },
          body: { answers: 'array' },
          response: { message: 'string', voteId: 'number' }
        },
        {
          method: 'GET',
          path: '/api/surveys/:id/status',
          description: 'Получение статуса опроса',
          auth: true,
          params: { id: 'number' },
          response: { status: 'draft|published|closed', canVote: 'boolean' }
        }
      ],

      mySurveys: [
        {
          method: 'GET',
          path: '/api/surveys/my',
          description: 'Список опросов текущего пользователя',
          auth: true,
          response: { surveys: 'array' }
        },
        {
          method: 'POST',
          path: '/api/surveys',
          description: 'Создание нового опроса',
          auth: true,
          body: {
            title: 'string (required)',
            description: 'string',
            questions: 'array',
            isPublic: 'boolean'
          },
          response: { survey: 'object', message: 'string' }
        },
        {
          method: 'PATCH',
          path: '/api/surveys/:id',
          description: 'Обновление опроса',
          auth: true,
          params: { id: 'number' },
          body: { title: 'string', description: 'string', questions: 'array' },
          response: { survey: 'object' }
        },
        {
          method: 'POST',
          path: '/api/surveys/:id/publish',
          description: 'Публикация опроса (сделать доступным)',
          auth: true,
          params: { id: 'number' },
          response: { message: 'string', status: 'published' }
        },
        {
          method: 'POST',
          path: '/api/surveys/:id/close',
          description: 'Закрытие опроса (прекратить сбор ответов)',
          auth: true,
          params: { id: 'number' },
          response: { message: 'string', status: 'closed' }
        },
        {
          method: 'DELETE',
          path: '/api/surveys/:id',
          description: 'Удаление опроса',
          auth: true,
          params: { id: 'number' },
          response: { message: 'string' }
        }
      ],

      analytics: [
        {
          method: 'GET',
          path: '/api/surveys/:id/analytics',
          description: 'Статистика и аналитика опроса',
          auth: true,
          params: { id: 'number' },
          response: { totalVotes: 'number', answers: 'object', charts: 'object' }
        },
        {
          method: 'GET',
          path: '/api/surveys/:id/export',
          description: 'Экспорт результатов опроса (CSV/JSON)',
          auth: true,
          params: { id: 'number' },
          query: { format: 'csv|json' },
          response: 'file | json'
        },
        {
          method: 'GET',
          path: '/api/surveys/:id/responses',
          description: 'Получение всех ответов на опрос',
          auth: true,
          params: { id: 'number' },
          response: { responses: 'array', total: 'number' }
        }
      ],
      
      admin: [
        {
          method: 'GET',
          path: '/api/admin/surveys',
          description: 'Админ: просмотр всех опросов системы',
          auth: true,
          admin: true,
          query: { page: 'number', userId: 'number', status: 'string' },
          response: { surveys: 'array', total: 'number' }
        },
        {
          method: 'DELETE',
          path: '/api/admin/surveys/:id',
          description: 'Админ: удаление любого опроса',
          auth: true,
          admin: true,
          params: { id: 'number' },
          response: { message: 'string' }
        },
        {
          method: 'PATCH',
          path: '/api/admin/surveys/:id/status',
          description: 'Админ: изменение статуса опроса',
          auth: true,
          admin: true,
          params: { id: 'number' },
          body: { status: 'draft|published|closed' },
          response: { message: 'string', survey: 'object' }
        }
      ]
    },
    

    system: {
      health: {
        method: 'GET',
        path: '/health',
        description: 'Проверка работоспособности сервера',
        auth: false,
        response: { status: 'ok', timestamp: 'string' }
      },
      docs: {
        method: 'GET',
        path: '/api-docs',
        description: 'Swagger UI документация',
        auth: false
      }
    }
  };
  

  res.status(200).json({
    success: true,
    routes: routes
  });
};