import './modules/auth.test';
import './modules/survey.test';
import './modules/admin.test';

beforeAll(() => {
  console.log('🧪 Запуск тестовой сессии...');
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;
});

afterAll(async () => {
  console.log('✅ Тестовая сессия завершена');
});

describe('Test Suite Loader', () => {
  it('должен загрузить все модули тестов', () => {
    expect(true).toBe(true);
  });
});