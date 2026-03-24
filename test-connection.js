// test-connection.js
const { PrismaClient } = require('@prisma/client');

// Перебираем возможные конфигурации
const configs = [
  { url: 'mysql://root:@localhost:3306/survey_test', label: 'Пустой пароль, порт 3306' },
  { url: 'mysql://root:@localhost:3307/survey_test', label: 'Пустой пароль, порт 3307' },
  { url: 'mysql://root:root@localhost:3306/survey_test', label: 'Пароль "root", порт 3306' },
  { url: 'mysql://root:root@localhost:3307/survey_test', label: 'Пароль "root", порт 3307' },
];

async function testConnection(url, label) {
  const prisma = new PrismaClient({ datasources: { db: { url } } });
  
  try {
    console.log(`🔌 ${label}...`);
    await prisma.$connect();
    
    // Попробуем прочитать таблицы
    const tables = await prisma.$queryRaw`SHOW TABLES`;
    console.log(`✅ УСПЕХ! Таблиц: ${tables.length}`);
    
    await prisma.$disconnect();
    return true;
  } catch (e) {
    console.log(`❌ ${label}: ${e.message.split('\n')[0]}`);
    await prisma.$disconnect().catch(() => {});
    return false;
  }
}

async function main() {
  console.log('🔍 Тестирую подключение к MySQL...\n');
  
  for (const config of configs) {
    const success = await testConnection(config.url, config.label);
    if (success) {
      console.log(`\n🎯 Рабочая конфигурация:`);
      console.log(`DATABASE_URL=${config.url}`);
      return;
    }
  }
  
  console.log('\n❌ Ни одно подключение не сработало!');
  console.log('\n💡 Проверьте:');
  console.log('  1. MySQL запущен в XAMPP?');
  console.log('  2. Правильный порт (3306 или 3307)?');
  console.log('  3. Пароль root (пустой или "root")?');
}

main();