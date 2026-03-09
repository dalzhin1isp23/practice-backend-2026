import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {

  const statuses = [
    { id: 1, name: 'Черновик' },
    { id: 2, name: 'Опубликован' },
    { id: 3, name: 'Завершен' },
  ];

  for (const s of statuses) {
    await prisma.status.upsert({
      where: { id: s.id },
      update: {},
      create: s,
    });
  }


  const types = [
    { id: 1, name: 'Одиночный выбор' },
    { id: 2, name: 'Множественный выбор' },
    { id: 3, name: 'Текстовый ответ' },
  ];

  for (const t of types) {
    await prisma.type.upsert({
      where: { id: t.id },
      update: {},
      create: t,
    });
  }

  console.log('Справочники успешно заполнены!');
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());