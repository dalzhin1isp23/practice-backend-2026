
import './modules/auth.test';

import './modules/survey.test';

import './modules/admin.test';

beforeAll(() => {
  console.log('Запуск тестовой сессии...');
  process.env.NODE_ENV = 'test';
});

afterAll(() => {
  console.log(' Тестовая сессия завершена');
});


describe('Test Suite Loader', () => {
  it('должен загрузить все модули тестов', () => {
    expect(true).toBe(true);
  });
});