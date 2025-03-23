import { PrismaClient, AssessmentType, CompetencyCode } from '@prisma/client'
import { hash } from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  // Хешируем пароль 
  const hashedPassword = await hash('password123', 10)
  
  // Создаем первого пользователя
  const vertoletov = await prisma.user.create({
    data: {
      email: 'vertoletov@example.com',
      password: hashedPassword,
      firstName: 'Вертолёт',
      lastName: 'Вертолётов', 
      birthDate: new Date('1988-06-20'),
      role: 'PILOT',
      university: 'Московский авиационный институт',
      company: 'Аэрофлот',
      position: 'Командир вертолёта Ми-8',
      experience: '12 лет летного стажа, 7500 часов налета'
    }
  })
  
  // Создаем второго пользователя
  const poletaev = await prisma.user.create({
    data: {
      email: 'poletaev@example.com',
      password: hashedPassword,
      firstName: 'Полёт',
      lastName: 'Полетаев',
      birthDate: new Date('1990-03-15'),
      role: 'PILOT',
      university: 'Ульяновский институт гражданской авиации',
      company: 'S7 Airlines',
      position: 'Второй пилот Airbus A320',
      experience: '8 лет летного стажа, 4200 часов налета'
    }
  })

  // Создаем оценки для Вертолётова
  await prisma.assessment.create({
    data: {
      type: 'EVAL',
      date: new Date('2024-03-05'),
      userId: vertoletov.id,
      instructorComment: 'Отличное владение вертолетом и знание процедур. Рекомендуется к повышению.',
      competencyScores: {
        create: [
          { competencyCode: 'APK', score: 5 },
          { competencyCode: 'COM', score: 4 },
          { competencyCode: 'FPA', score: 5 },
          { competencyCode: 'FPM', score: 5 },
          { competencyCode: 'LTW', score: 4 },
          { competencyCode: 'PSD', score: 5 },
          { competencyCode: 'SAW', score: 4 },
          { competencyCode: 'WLM', score: 5 },
          { competencyCode: 'KNO', score: 5 }
        ]
      }
    }
  })

  await prisma.assessment.create({
    data: {
      type: 'QUALIFICATION',
      date: new Date('2024-02-10'),
      userId: vertoletov.id,
      instructorComment: 'Квалификационная проверка пройдена на отлично. Показал высокий уровень профессионализма.',
      competencyScores: {
        create: [
          { competencyCode: 'APK', score: 5 },
          { competencyCode: 'COM', score: 4 },
          { competencyCode: 'FPA', score: 5 },
          { competencyCode: 'FPM', score: 5 },
          { competencyCode: 'LTW', score: 4 },
          { competencyCode: 'PSD', score: 4 },
          { competencyCode: 'SAW', score: 5 },
          { competencyCode: 'WLM', score: 4 },
          { competencyCode: 'KNO', score: 5 }
        ]
      }
    }
  })

  // Создаем оценки для Полетаева
  await prisma.assessment.create({
    data: {
      type: 'EVAL',
      date: new Date('2024-03-12'),
      userId: poletaev.id,
      instructorComment: 'Хорошее знание процедур, нужно улучшить коммуникацию в критических ситуациях.',
      competencyScores: {
        create: [
          { competencyCode: 'APK', score: 4 },
          { competencyCode: 'COM', score: 3 },
          { competencyCode: 'FPA', score: 4 },
          { competencyCode: 'FPM', score: 4 },
          { competencyCode: 'LTW', score: 3 },
          { competencyCode: 'PSD', score: 4 },
          { competencyCode: 'SAW', score: 3 },
          { competencyCode: 'WLM', score: 4 },
          { competencyCode: 'KNO', score: 4 }
        ]
      }
    }
  })

  await prisma.assessment.create({
    data: {
      type: 'AVIATION_EVENT',
      date: new Date('2024-01-25'),
      userId: poletaev.id,
      instructorComment: 'Действия при авиационном событии были адекватными. Необходимо усилить контроль за выполнением SOP.',
      competencyScores: {
        create: [
          { competencyCode: 'APK', score: 3 },
          { competencyCode: 'COM', score: 3 },
          { competencyCode: 'FPA', score: 4 },
          { competencyCode: 'FPM', score: 4 },
          { competencyCode: 'LTW', score: 3 },
          { competencyCode: 'PSD', score: 4 },
          { competencyCode: 'SAW', score: 3 },
          { competencyCode: 'WLM', score: 3 },
          { competencyCode: 'KNO', score: 4 }
        ]
      }
    }
  })

  console.log('База данных production успешно заполнена тестовыми пользователями и оценками')
}

main()
  .catch((e) => {
    console.error('Ошибка заполнения базы данных:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
