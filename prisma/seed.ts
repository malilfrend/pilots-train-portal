import { PrismaClient, UserRole, CompetencyCode } from '@prisma/client'
import { hash } from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('Очистка существующих данных...')
  
  // Сначала удаляем данные из зависимых таблиц
  await prisma.pilotCompetencyScore.deleteMany({})
  await prisma.competencyWeight.deleteMany({})
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
      role: UserRole.PILOT,
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
      role: UserRole.PILOT,
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
      role: UserRole.INSTRUCTOR,
      university: 'СПбГУ ГА',
      company: 'Авиационный учебный центр',
      position: 'Старший инструктор',
      experience: '25 лет летного стажа, 15000 часов налета'
    }
  })

  // Создаем профиль администратора
  const adminProfile = await prisma.userProfile.create({
    data: {
      email: 'admin@example.com',
      password: hashedPassword,
      firstName: 'Админ',
      lastName: 'Админов',
      birthDate: new Date('1980-01-01'),
      role: UserRole.SUPER_ADMIN,
      superAdmin: true
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

  // Создаем веса компетенций для разных источников
  const competencyWeights = [
    // KNO - Knowledge
    { competencyCode: CompetencyCode.KNO, sourceType: 'KP', weight: 0.35 },
    { competencyCode: CompetencyCode.KNO, sourceType: 'PADP', weight: 0.15 },
    { competencyCode: CompetencyCode.KNO, sourceType: 'EVAL', weight: 0.35 },
    { competencyCode: CompetencyCode.KNO, sourceType: 'AS', weight: 0.15 },
    
    // PRO - Procedures
    { competencyCode: CompetencyCode.PRO, sourceType: 'KP', weight: 0.3 },
    { competencyCode: CompetencyCode.PRO, sourceType: 'PADP', weight: 0.2 },
    { competencyCode: CompetencyCode.PRO, sourceType: 'EVAL', weight: 0.3 },
    { competencyCode: CompetencyCode.PRO, sourceType: 'AS', weight: 0.2 },
    
    // FPA - Flight Path Automation
    { competencyCode: CompetencyCode.FPA, sourceType: 'KP', weight: 0.25 },
    { competencyCode: CompetencyCode.FPA, sourceType: 'PADP', weight: 0.3 },
    { competencyCode: CompetencyCode.FPA, sourceType: 'EVAL', weight: 0.25 },
    { competencyCode: CompetencyCode.FPA, sourceType: 'AS', weight: 0.2 },
    
    // FPM - Flight Path Manual
    { competencyCode: CompetencyCode.FPM, sourceType: 'KP', weight: 0.3 },
    { competencyCode: CompetencyCode.FPM, sourceType: 'PADP', weight: 0.25 },
    { competencyCode: CompetencyCode.FPM, sourceType: 'EVAL', weight: 0.25 },
    { competencyCode: CompetencyCode.FPM, sourceType: 'AS', weight: 0.2 },
    
    // COM - Communication
    { competencyCode: CompetencyCode.COM, sourceType: 'KP', weight: 0.25 },
    { competencyCode: CompetencyCode.COM, sourceType: 'PADP', weight: 0.2 },
    { competencyCode: CompetencyCode.COM, sourceType: 'EVAL', weight: 0.35 },
    { competencyCode: CompetencyCode.COM, sourceType: 'AS', weight: 0.2 },
    
    // LDR - Leadership
    { competencyCode: CompetencyCode.LDR, sourceType: 'KP', weight: 0.2 },
    { competencyCode: CompetencyCode.LDR, sourceType: 'PADP', weight: 0.15 },
    { competencyCode: CompetencyCode.LDR, sourceType: 'EVAL', weight: 0.4 },
    { competencyCode: CompetencyCode.LDR, sourceType: 'AS', weight: 0.25 },
    
    // WSA - Workload and Situation Awareness
    { competencyCode: CompetencyCode.WSA, sourceType: 'KP', weight: 0.25 },
    { competencyCode: CompetencyCode.WSA, sourceType: 'PADP', weight: 0.2 },
    { competencyCode: CompetencyCode.WSA, sourceType: 'EVAL', weight: 0.3 },
    { competencyCode: CompetencyCode.WSA, sourceType: 'AS', weight: 0.25 },
    
    // WLM - Workload Management
    { competencyCode: CompetencyCode.WLM, sourceType: 'KP', weight: 0.25 },
    { competencyCode: CompetencyCode.WLM, sourceType: 'PADP', weight: 0.2 },
    { competencyCode: CompetencyCode.WLM, sourceType: 'EVAL', weight: 0.3 },
    { competencyCode: CompetencyCode.WLM, sourceType: 'AS', weight: 0.25 },
    
    // PSD - Problem Solving and Decision
    { competencyCode: CompetencyCode.PSD, sourceType: 'KP', weight: 0.25 },
    { competencyCode: CompetencyCode.PSD, sourceType: 'PADP', weight: 0.15 },
    { competencyCode: CompetencyCode.PSD, sourceType: 'EVAL', weight: 0.3 },
    { competencyCode: CompetencyCode.PSD, sourceType: 'AS', weight: 0.3 }
  ]

  for (const weight of competencyWeights) {
    await prisma.competencyWeight.create({
      //@ts-ignore
      data: weight
    })
  }

  // Создаем оценки для Вертолётова (KP - Квалификационная проверка)
  await prisma.pilotCompetencyScore.create({
    data: {
      pilotId: vertoletovPilot.id,
      instructorId: mentor.id,
      competencyCode: CompetencyCode.KNO,
      sourceType: 'KP',
      score: 5,
      date: new Date('2024-02-10'),
      comment: 'Отличное знание и применение теоретических знаний'
    }
  })

  await prisma.pilotCompetencyScore.create({
    data: {
      pilotId: vertoletovPilot.id,
      instructorId: mentor.id,
      competencyCode: CompetencyCode.FPM,
      sourceType: 'KP',
      score: 4,
      date: new Date('2024-02-10'),
      comment: 'Хорошие навыки ручного пилотирования'
    }
  })

  // Создаем оценки для Вертолётова (EVAL - Оценка)
  await prisma.pilotCompetencyScore.create({
    data: {
      pilotId: vertoletovPilot.id,
      instructorId: mentor.id,
      competencyCode: CompetencyCode.COM,
      sourceType: 'EVAL',
      score: 5,
      date: new Date('2024-03-05'),
      comment: 'Превосходные коммуникативные навыки'
    }
  })

  await prisma.pilotCompetencyScore.create({
    data: {
      pilotId: vertoletovPilot.id,
      instructorId: mentor.id,
      competencyCode: CompetencyCode.PSD,
      sourceType: 'EVAL',
      score: 4,
      date: new Date('2024-03-05'),
      comment: 'Хорошие навыки решения проблем и принятия решений'
    }
  })

  // Создаем оценки для Полетаева (EVAL - Оценка)
  await prisma.pilotCompetencyScore.create({
    data: {
      pilotId: poletaevPilot.id,
      instructorId: mentor.id,
      competencyCode: CompetencyCode.KNO,
      sourceType: 'EVAL',
      score: 4,
      date: new Date('2024-03-12'),
      comment: 'Хорошие теоретические знания'
    }
  })

  await prisma.pilotCompetencyScore.create({
    data: {
      pilotId: poletaevPilot.id,
      instructorId: mentor.id,
      competencyCode: CompetencyCode.COM,
      sourceType: 'EVAL',
      score: 3,
      date: new Date('2024-03-12'),
      comment: 'Необходимо улучшить коммуникацию в критических ситуациях'
    }
  })

  // Создаем оценки для Полетаева (AS - Авиационное событие)
  await prisma.pilotCompetencyScore.create({
    data: {
      pilotId: poletaevPilot.id,
      instructorId: mentor.id,
      competencyCode: CompetencyCode.PSD,
      sourceType: 'AS',
      score: 4,
      date: new Date('2024-01-25'),
      comment: 'Хорошие решения во время авиационного события'
    }
  })

  await prisma.pilotCompetencyScore.create({
    data: {
      pilotId: poletaevPilot.id,
      instructorId: mentor.id,
      competencyCode: CompetencyCode.WLM,
      sourceType: 'AS',
      score: 3,
      date: new Date('2024-01-25'),
      comment: 'Требуется улучшение управления рабочей нагрузкой в стрессовых ситуациях'
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
