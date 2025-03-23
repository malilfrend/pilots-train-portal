import { PrismaClient } from '@prisma/client'
import { hash } from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  // Очищаем существующие данные
  await prisma.comment.deleteMany()
  await prisma.exercise.deleteMany()
  await prisma.session.deleteMany()
  await prisma.user.deleteMany()

  // Создаем тестового пользователя
  const hashedPassword = await hash('password123', 10)
  
  await prisma.user.create({
    data: {
      email: 'pilot@example.com',
      password: hashedPassword,
      firstName: 'Иван',
      lastName: 'Петров',
      birthDate: new Date('1985-05-15'),
      role: 'PILOT',
      university: 'Московский авиационный институт',
      company: 'Аэрофлот',
      position: 'Второй пилот Boeing 737',
      experience: '5 лет летного стажа, 3500 часов налета'
    }
  })
  
  await prisma.user.create({
    data: {
      email: 'instructor@example.com',
      password: hashedPassword,
      firstName: 'Сергей',
      lastName: 'Иванов',
      birthDate: new Date('1975-08-10'),
      role: 'INSTRUCTOR',
      university: 'Ульяновский институт гражданской авиации',
      company: 'Авиационный учебный центр',
      position: 'Старший инструктор',
      experience: '20 лет летного стажа, 12000 часов налета'
    }
  })

  const sessions = [
    {
      number: 1,
      title: 'Сессия 1: Базовая подготовка',
      description: 'Отработка базовых навыков пилотирования и стандартных процедур',
      exercises: {
        create: [
          {
            title: 'Взлет и посадка в нормальных условиях',
            description:
              'Отработка стандартных процедур взлета и посадки, включая все необходимые проверки и действия',
          },
          {
            title: 'Уход на второй круг',
            description:
              'Процедуры ухода на второй круг с различных высот и в разных конфигурациях',
          },
          {
            title: 'Полет по кругу',
            description:
              'Отработка захода на посадку по кругу с соблюдением всех стандартных процедур',
          },
        ],
      },
    },
    {
      number: 2,
      title: 'Сессия 2: Нештатные ситуации при взлете',
      description: 'Отработка действий при отказах на этапе взлета',
      exercises: {
        create: [
          {
            title: 'Отказ двигателя на взлете до V1',
            description: 'Действия при отказе двигателя до достижения скорости принятия решения',
          },
          {
            title: 'Отказ двигателя на взлете после V1',
            description: 'Действия при отказе двигателя после достижения скорости принятия решения',
          },
        ],
      },
    },
    {
      number: 3,
      title: 'Сессия 3: Аварийные ситуации в полете',
      description: 'Отработка действий при различных отказах систем в полете',
      exercises: {
        create: [
          {
            title: 'Разгерметизация',
            description: 'Действия экипажа при разгерметизации на высоте крейсерского полета',
          },
          {
            title: 'Пожар двигателя',
            description:
              'Действия при пожаре двигателя в полете, применение соответствующих чек-листов',
          },
          {
            title: 'Отказ гидросистемы',
            description: 'Действия при отказе гидросистемы, особенности пилотирования',
          },
        ],
      },
    },
    {
      number: 4,
      title: 'Сессия 4: Сложные метеоусловия',
      description: 'Отработка взлетов и посадок в сложных метеоусловиях',
      exercises: {
        create: [
          {
            title: 'Заход в условиях сильного бокового ветра',
            description: 'Техника пилотирования при заходе и посадке с боковым ветром',
          },
          {
            title: 'Заход в условиях низкой видимости',
            description: 'Процедуры захода и посадки в условиях CAT II',
          },
        ],
      },
    },
    {
      number: 5,
      title: 'Сессия 5: Особые случаи захода на посадку',
      description: 'Отработка нестандартных заходов на посадку',
      exercises: {
        create: [
          {
            title: 'Заход с неисправной механизацией',
            description: 'Особенности захода и посадки с отказавшей механизацией крыла',
          },
          {
            title: 'Заход с частичным отказом авионики',
            description: 'Действия при частичном отказе пилотажно-навигационного оборудования',
          },
          {
            title: 'Визуальный заход',
            description: 'Выполнение визуального захода на посадку в различных условиях',
          },
        ],
      },
    },
    {
      number: 6,
      title: 'Сессия 6: LOFT',
      description: 'Line Oriented Flight Training - комплексная проверка навыков',
      exercises: {
        create: [
          {
            title: 'Полет по маршруту с нештатными ситуациями',
            description: 'Выполнение полета по маршруту с различными нештатными ситуациями',
          },
          {
            title: 'Принятие решений в сложной обстановке',
            description: 'Отработка навыков принятия решений в условиях множественных отказов',
          },
        ],
      },
    },
  ]

  for (const session of sessions) {
    await prisma.session.create({
      data: session,
    })
  }

  console.log('База данных успешно заполнена')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
