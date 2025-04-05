import { PrismaClient, AssessmentType, CompetencyCode } from '@prisma/client'
import { hash } from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('Очистка существующих данных...')
  
  // Сначала удаляем данные из зависимых таблиц
  await prisma.competencyScore.deleteMany({})
  await prisma.assessment.deleteMany({})
  await prisma.instructor.deleteMany({})
  await prisma.pilot.deleteMany({})
  await prisma.userProfile.deleteMany({})
  
  console.log('Данные очищены. Начинаем заполнение...')

  // Хешируем пароль 
  const hashedPassword = await hash('password123', 10)
  
  // Создаем профиль первого пользователя (пилот)
  const vertoletovProfile = await prisma.userProfile.create({
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
  
  // Создаем профиль второго пользователя (пилот)
  const poletaevProfile = await prisma.userProfile.create({
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

  // Создаем профиль третьего пользователя (инструктор)
  const mentorProfile = await prisma.userProfile.create({
    data: {
      email: 'mentor@example.com',
      password: hashedPassword,
      firstName: 'Иван',
      lastName: 'Инструкторов',
      birthDate: new Date('1975-08-22'),
      role: 'INSTRUCTOR',
      university: 'СПбГУ ГА',
      company: 'Авиационный учебный центр',
      position: 'Старший инструктор',
      experience: '25 лет летного стажа, 15000 часов налета'
    }
  })

  // Создаем запись пилота для Вертолётова
  const vertoletovPilot = await prisma.pilot.create({
    data: {
      profileId: vertoletovProfile.id
    }
  })

  // Создаем запись пилота для Полетаева
  const poletaevPilot = await prisma.pilot.create({
    data: {
      profileId: poletaevProfile.id
    }
  })

  // Создаем запись инструктора
  const mentor = await prisma.instructor.create({
    data: {
      profileId: mentorProfile.id
    }
  })

  // Создаем оценки для Вертолётова
  await prisma.assessment.create({
    data: {
      type: 'EVAL',
      date: new Date('2024-03-05'),
      pilotId: vertoletovPilot.id,
      instructorId: mentor.id,
      instructorComment: "FPM - Контролировать пилотирование, не допускать крен при выполнении маневра по команде TAWS. Учитывать боковой ветер при заходе на посадку в условиях ограниченной видимости (доворот на полосу при переходе на визуальное пилотирование). APK - Повторить правила применения EMERGENCY EVACUATION CHECKLIST. KNO - Повторить порядок расчета PERFOMANCE в аварийных и сложных ситуациях.",
      competencyScores: {
        create: [
          { competencyCode: 'APK', score: 3 },
          { competencyCode: 'COM', score: 5 },
          { competencyCode: 'FPA', score: 5 },
          { competencyCode: 'FPM', score: 3 },
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
      pilotId: vertoletovPilot.id,
      instructorId: mentor.id,
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
      pilotId: poletaevPilot.id,
      instructorId: mentor.id,
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
      pilotId: poletaevPilot.id,
      instructorId: mentor.id,
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

  console.log('База данных успешно заполнена тестовыми пользователями и оценками')
}

main()
  .catch((e) => {
    console.error('Ошибка заполнения базы данных:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
