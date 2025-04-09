import { PrismaClient, UserRole, CompetencyCode } from '@prisma/client'
import { hash } from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('Очистка существующих данных...')
  
  // Сначала удаляем данные из зависимых таблиц
  try {
    await prisma.pilotCompetencyScore.deleteMany({})
    console.log('Удалены записи из PilotCompetencyScore')
  } catch (e) {
    console.log('Таблица PilotCompetencyScore не существует или не может быть очищена')
  }
  
  try {
    await prisma.competencyWeight.deleteMany({})
    console.log('Удалены записи из CompetencyWeight')
  } catch (e) {
    console.log('Таблица CompetencyWeight не существует или не может быть очищена')
  }
  
  try {
    await prisma.instructor.deleteMany({})
    console.log('Удалены записи из Instructor')
  } catch (e) {
    console.log('Таблица Instructor не существует или не может быть очищена')
  }
  
  try {
    await prisma.pilot.deleteMany({})
    console.log('Удалены записи из Pilot')
  } catch (e) {
    console.log('Таблица Pilot не существует или не может быть очищена')
  }
  
  try {
    await prisma.userProfile.deleteMany({})
    console.log('Удалены записи из UserProfile')
  } catch (e) {
    console.log('Таблица UserProfile не существует или не может быть очищена')
  }
  
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
      competencyCode: CompetencyCode.PRO,
      sourceType: 'KP',
      score: 4,
      date: new Date('2024-02-10'),
      comment: 'Хорошее следование процедурам при квалификационной проверке'
    }
  })

  await prisma.pilotCompetencyScore.create({
    data: {
      pilotId: vertoletovPilot.id,
      instructorId: mentor.id,
      competencyCode: CompetencyCode.FPA,
      sourceType: 'KP',
      score: 5,
      date: new Date('2024-02-10'),
      comment: 'Отличное использование автоматики'
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

  await prisma.pilotCompetencyScore.create({
    data: {
      pilotId: vertoletovPilot.id,
      instructorId: mentor.id,
      competencyCode: CompetencyCode.COM,
      sourceType: 'KP',
      score: 4,
      date: new Date('2024-02-10'),
      comment: 'Хорошие коммуникативные навыки при проверке'
    }
  })

  await prisma.pilotCompetencyScore.create({
    data: {
      pilotId: vertoletovPilot.id,
      instructorId: mentor.id,
      competencyCode: CompetencyCode.LDR,
      sourceType: 'KP',
      score: 3,
      date: new Date('2024-02-10'),
      comment: 'Удовлетворительные лидерские качества'
    }
  })

  await prisma.pilotCompetencyScore.create({
    data: {
      pilotId: vertoletovPilot.id,
      instructorId: mentor.id,
      competencyCode: CompetencyCode.WSA,
      sourceType: 'KP',
      score: 5,
      date: new Date('2024-02-10'),
      comment: 'Отличная ситуационная осведомленность'
    }
  })

  await prisma.pilotCompetencyScore.create({
    data: {
      pilotId: vertoletovPilot.id,
      instructorId: mentor.id,
      competencyCode: CompetencyCode.WLM,
      sourceType: 'KP',
      score: 4,
      date: new Date('2024-02-10'),
      comment: 'Хорошее распределение рабочей нагрузки'
    }
  })

  await prisma.pilotCompetencyScore.create({
    data: {
      pilotId: vertoletovPilot.id,
      instructorId: mentor.id,
      competencyCode: CompetencyCode.PSD,
      sourceType: 'KP',
      score: 4,
      date: new Date('2024-02-10'),
      comment: 'Хорошие навыки принятия решений при проверке'
    }
  })

  // Создаем оценки для Вертолётова (PADP - Программа анализа данных полета)
  await prisma.pilotCompetencyScore.create({
    data: {
      pilotId: vertoletovPilot.id,
      instructorId: mentor.id,
      competencyCode: CompetencyCode.KNO,
      sourceType: 'PADP',
      score: 4,
      date: new Date('2024-01-15'),
      comment: 'Хорошее применение знаний по результатам анализа полета'
    }
  })

  await prisma.pilotCompetencyScore.create({
    data: {
      pilotId: vertoletovPilot.id,
      instructorId: mentor.id,
      competencyCode: CompetencyCode.PRO,
      sourceType: 'PADP',
      score: 3,
      date: new Date('2024-01-15'),
      comment: 'Удовлетворительное соблюдение процедур по данным анализа'
    }
  })

  await prisma.pilotCompetencyScore.create({
    data: {
      pilotId: vertoletovPilot.id,
      instructorId: mentor.id,
      competencyCode: CompetencyCode.FPA,
      sourceType: 'PADP',
      score: 5,
      date: new Date('2024-01-15'),
      comment: 'Отличное управление автоматикой по данным полета'
    }
  })

  await prisma.pilotCompetencyScore.create({
    data: {
      pilotId: vertoletovPilot.id,
      instructorId: mentor.id,
      competencyCode: CompetencyCode.FPM,
      sourceType: 'PADP',
      score: 3,
      date: new Date('2024-01-15'),
      comment: 'Удовлетворительное ручное управление по данным полета'
    }
  })

  await prisma.pilotCompetencyScore.create({
    data: {
      pilotId: vertoletovPilot.id,
      instructorId: mentor.id,
      competencyCode: CompetencyCode.COM,
      sourceType: 'PADP',
      score: 2,
      date: new Date('2024-01-15'),
      comment: 'Недостаточная коммуникация по данным записей полета'
    }
  })

  await prisma.pilotCompetencyScore.create({
    data: {
      pilotId: vertoletovPilot.id,
      instructorId: mentor.id,
      competencyCode: CompetencyCode.LDR,
      sourceType: 'PADP',
      score: 3,
      date: new Date('2024-01-15'),
      comment: 'Удовлетворительные лидерские качества по данным анализа'
    }
  })

  await prisma.pilotCompetencyScore.create({
    data: {
      pilotId: vertoletovPilot.id,
      instructorId: mentor.id,
      competencyCode: CompetencyCode.WSA,
      sourceType: 'PADP',
      score: 4,
      date: new Date('2024-01-15'),
      comment: 'Хорошая ситуационная осведомленность по данным полета'
    }
  })

  await prisma.pilotCompetencyScore.create({
    data: {
      pilotId: vertoletovPilot.id,
      instructorId: mentor.id,
      competencyCode: CompetencyCode.WLM,
      sourceType: 'PADP',
      score: 4,
      date: new Date('2024-01-15'),
      comment: 'Хорошее управление нагрузкой по данным полета'
    }
  })

  await prisma.pilotCompetencyScore.create({
    data: {
      pilotId: vertoletovPilot.id,
      instructorId: mentor.id,
      competencyCode: CompetencyCode.PSD,
      sourceType: 'PADP',
      score: 3,
      date: new Date('2024-01-15'),
      comment: 'Удовлетворительные решения по данным анализа'
    }
  })

  // Создаем оценки для Вертолётова (EVAL - Оценка)
  await prisma.pilotCompetencyScore.create({
    data: {
      pilotId: vertoletovPilot.id,
      instructorId: mentor.id,
      competencyCode: CompetencyCode.KNO,
      sourceType: 'EVAL',
      score: 4,
      date: new Date('2024-03-05'),
      comment: 'Хорошее применение знаний в стандартных ситуациях'
    }
  })

  await prisma.pilotCompetencyScore.create({
    data: {
      pilotId: vertoletovPilot.id,
      instructorId: mentor.id,
      competencyCode: CompetencyCode.PRO,
      sourceType: 'EVAL',
      score: 5,
      date: new Date('2024-03-05'),
      comment: 'Отличное следование процедурам'
    }
  })

  await prisma.pilotCompetencyScore.create({
    data: {
      pilotId: vertoletovPilot.id,
      instructorId: mentor.id,
      competencyCode: CompetencyCode.FPA,
      sourceType: 'EVAL',
      score: 4,
      date: new Date('2024-03-05'),
      comment: 'Хорошее использование автоматических систем'
    }
  })

  await prisma.pilotCompetencyScore.create({
    data: {
      pilotId: vertoletovPilot.id,
      instructorId: mentor.id,
      competencyCode: CompetencyCode.FPM,
      sourceType: 'EVAL',
      score: 3,
      date: new Date('2024-03-05'),
      comment: 'Удовлетворительное ручное пилотирование'
    }
  })

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
      competencyCode: CompetencyCode.LDR,
      sourceType: 'EVAL',
      score: 4,
      date: new Date('2024-03-05'),
      comment: 'Хорошие лидерские качества'
    }
  })

  await prisma.pilotCompetencyScore.create({
    data: {
      pilotId: vertoletovPilot.id,
      instructorId: mentor.id,
      competencyCode: CompetencyCode.WSA,
      sourceType: 'EVAL',
      score: 3,
      date: new Date('2024-03-05'),
      comment: 'Удовлетворительная ситуационная осведомленность'
    }
  })

  await prisma.pilotCompetencyScore.create({
    data: {
      pilotId: vertoletovPilot.id,
      instructorId: mentor.id,
      competencyCode: CompetencyCode.WLM,
      sourceType: 'EVAL',
      score: 4,
      date: new Date('2024-03-05'),
      comment: 'Хорошее управление рабочей нагрузкой'
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

  // Создаем оценки для Вертолётова (AS - Авиационное событие)
  await prisma.pilotCompetencyScore.create({
    data: {
      pilotId: vertoletovPilot.id,
      instructorId: mentor.id,
      competencyCode: CompetencyCode.KNO,
      sourceType: 'AS',
      score: 3,
      date: new Date('2024-01-25'),
      comment: 'Удовлетворительное применение знаний в нештатной ситуации'
    }
  })

  await prisma.pilotCompetencyScore.create({
    data: {
      pilotId: vertoletovPilot.id,
      instructorId: mentor.id,
      competencyCode: CompetencyCode.PRO,
      sourceType: 'AS',
      score: 4,
      date: new Date('2024-01-25'),
      comment: 'Хорошее следование процедурам в нештатной ситуации'
    }
  })

  await prisma.pilotCompetencyScore.create({
    data: {
      pilotId: vertoletovPilot.id,
      instructorId: mentor.id,
      competencyCode: CompetencyCode.FPA,
      sourceType: 'AS',
      score: 3,
      date: new Date('2024-01-25'),
      comment: 'Удовлетворительное использование автоматики в нештатной ситуации'
    }
  })

  await prisma.pilotCompetencyScore.create({
    data: {
      pilotId: vertoletovPilot.id,
      instructorId: mentor.id,
      competencyCode: CompetencyCode.FPM,
      sourceType: 'AS',
      score: 5,
      date: new Date('2024-01-25'),
      comment: 'Отличное ручное пилотирование в сложной ситуации'
    }
  })

  await prisma.pilotCompetencyScore.create({
    data: {
      pilotId: vertoletovPilot.id,
      instructorId: mentor.id,
      competencyCode: CompetencyCode.COM,
      sourceType: 'AS',
      score: 4,
      date: new Date('2024-01-25'),
      comment: 'Хорошая коммуникация в критической ситуации'
    }
  })

  await prisma.pilotCompetencyScore.create({
    data: {
      pilotId: vertoletovPilot.id,
      instructorId: mentor.id,
      competencyCode: CompetencyCode.LDR,
      sourceType: 'AS',
      score: 3,
      date: new Date('2024-01-25'),
      comment: 'Удовлетворительные лидерские качества в нештатной ситуации'
    }
  })

  await prisma.pilotCompetencyScore.create({
    data: {
      pilotId: vertoletovPilot.id,
      instructorId: mentor.id,
      competencyCode: CompetencyCode.WSA,
      sourceType: 'AS',
      score: 2,
      date: new Date('2024-01-25'),
      comment: 'Недостаточная ситуационная осведомленность в критической ситуации'
    }
  })

  await prisma.pilotCompetencyScore.create({
    data: {
      pilotId: vertoletovPilot.id,
      instructorId: mentor.id,
      competencyCode: CompetencyCode.WLM,
      sourceType: 'AS',
      score: 3,
      date: new Date('2024-01-25'),
      comment: 'Удовлетворительное управление нагрузкой в нештатной ситуации'
    }
  })

  await prisma.pilotCompetencyScore.create({
    data: {
      pilotId: vertoletovPilot.id,
      instructorId: mentor.id,
      competencyCode: CompetencyCode.PSD,
      sourceType: 'AS',
      score: 4,
      date: new Date('2024-01-25'),
      comment: 'Хорошие решения в нештатной ситуации'
    }
  })

  // Создаем оценки для Полетаева (KP - Квалификационная проверка)
  await prisma.pilotCompetencyScore.create({
    data: {
      pilotId: poletaevPilot.id,
      instructorId: mentor.id,
      competencyCode: CompetencyCode.KNO,
      sourceType: 'KP',
      score: 4,
      date: new Date('2024-01-31'),
      comment: 'Хорошие теоретические знания при проверке'
    }
  })

  await prisma.pilotCompetencyScore.create({
    data: {
      pilotId: poletaevPilot.id,
      instructorId: mentor.id,
      competencyCode: CompetencyCode.PRO,
      sourceType: 'KP',
      score: 3,
      date: new Date('2024-01-31'),
      comment: 'Удовлетворительное соблюдение процедур'
    }
  })

  await prisma.pilotCompetencyScore.create({
    data: {
      pilotId: poletaevPilot.id,
      instructorId: mentor.id,
      competencyCode: CompetencyCode.FPA,
      sourceType: 'KP',
      score: 4,
      date: new Date('2024-01-31'),
      comment: 'Хорошее использование автоматики'
    }
  })

  await prisma.pilotCompetencyScore.create({
    data: {
      pilotId: poletaevPilot.id,
      instructorId: mentor.id,
      competencyCode: CompetencyCode.FPM,
      sourceType: 'KP',
      score: 3,
      date: new Date('2024-01-31'),
      comment: 'Удовлетворительное ручное пилотирование'
    }
  })

  await prisma.pilotCompetencyScore.create({
    data: {
      pilotId: poletaevPilot.id,
      instructorId: mentor.id,
      competencyCode: CompetencyCode.COM,
      sourceType: 'KP',
      score: 3,
      date: new Date('2024-01-31'),
      comment: 'Удовлетворительные коммуникативные навыки'
    }
  })

  await prisma.pilotCompetencyScore.create({
    data: {
      pilotId: poletaevPilot.id,
      instructorId: mentor.id,
      competencyCode: CompetencyCode.LDR,
      sourceType: 'KP',
      score: 3,
      date: new Date('2024-01-31'),
      comment: 'Удовлетворительные лидерские качества'
    }
  })

  await prisma.pilotCompetencyScore.create({
    data: {
      pilotId: poletaevPilot.id,
      instructorId: mentor.id,
      competencyCode: CompetencyCode.WSA,
      sourceType: 'KP',
      score: 4,
      date: new Date('2024-01-31'),
      comment: 'Хорошая ситуационная осведомленность'
    }
  })

  await prisma.pilotCompetencyScore.create({
    data: {
      pilotId: poletaevPilot.id,
      instructorId: mentor.id,
      competencyCode: CompetencyCode.WLM,
      sourceType: 'KP',
      score: 3,
      date: new Date('2024-01-31'),
      comment: 'Удовлетворительное управление нагрузкой'
    }
  })

  await prisma.pilotCompetencyScore.create({
    data: {
      pilotId: poletaevPilot.id,
      instructorId: mentor.id,
      competencyCode: CompetencyCode.PSD,
      sourceType: 'KP',
      score: 3,
      date: new Date('2024-01-31'),
      comment: 'Удовлетворительные навыки принятия решений'
    }
  })

  // Создаем оценки для Полетаева (PADP - Программа анализа данных полета)
  await prisma.pilotCompetencyScore.create({
    data: {
      pilotId: poletaevPilot.id,
      instructorId: mentor.id,
      competencyCode: CompetencyCode.KNO,
      sourceType: 'PADP',
      score: 3,
      date: new Date('2024-01-10'),
      comment: 'Удовлетворительное применение знаний по данным полета'
    }
  })

  await prisma.pilotCompetencyScore.create({
    data: {
      pilotId: poletaevPilot.id,
      instructorId: mentor.id,
      competencyCode: CompetencyCode.PRO,
      sourceType: 'PADP',
      score: 4,
      date: new Date('2024-01-10'),
      comment: 'Хорошее соблюдение процедур по данным анализа'
    }
  })

  await prisma.pilotCompetencyScore.create({
    data: {
      pilotId: poletaevPilot.id,
      instructorId: mentor.id,
      competencyCode: CompetencyCode.FPA,
      sourceType: 'PADP',
      score: 4,
      date: new Date('2024-01-10'),
      comment: 'Хорошее использование автоматики по данным полета'
    }
  })

  await prisma.pilotCompetencyScore.create({
    data: {
      pilotId: poletaevPilot.id,
      instructorId: mentor.id,
      competencyCode: CompetencyCode.FPM,
      sourceType: 'PADP',
      score: 2,
      date: new Date('2024-01-10'),
      comment: 'Требуется улучшение навыков ручного пилотирования'
    }
  })

  await prisma.pilotCompetencyScore.create({
    data: {
      pilotId: poletaevPilot.id,
      instructorId: mentor.id,
      competencyCode: CompetencyCode.COM,
      sourceType: 'PADP',
      score: 3,
      date: new Date('2024-01-10'),
      comment: 'Удовлетворительная коммуникация по данным полета'
    }
  })

  await prisma.pilotCompetencyScore.create({
    data: {
      pilotId: poletaevPilot.id,
      instructorId: mentor.id,
      competencyCode: CompetencyCode.LDR,
      sourceType: 'PADP',
      score: 2,
      date: new Date('2024-01-10'),
      comment: 'Недостаточные лидерские качества по данным анализа'
    }
  })

  await prisma.pilotCompetencyScore.create({
    data: {
      pilotId: poletaevPilot.id,
      instructorId: mentor.id,
      competencyCode: CompetencyCode.WSA,
      sourceType: 'PADP',
      score: 3,
      date: new Date('2024-01-10'),
      comment: 'Удовлетворительная ситуационная осведомленность'
    }
  })

  await prisma.pilotCompetencyScore.create({
    data: {
      pilotId: poletaevPilot.id,
      instructorId: mentor.id,
      competencyCode: CompetencyCode.WLM,
      sourceType: 'PADP',
      score: 3,
      date: new Date('2024-01-10'),
      comment: 'Удовлетворительное управление нагрузкой'
    }
  })

  await prisma.pilotCompetencyScore.create({
    data: {
      pilotId: poletaevPilot.id,
      instructorId: mentor.id,
      competencyCode: CompetencyCode.PSD,
      sourceType: 'PADP',
      score: 3,
      date: new Date('2024-01-10'),
      comment: 'Удовлетворительные навыки принятия решений'
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
      competencyCode: CompetencyCode.PRO,
      sourceType: 'EVAL',
      score: 4,
      date: new Date('2024-03-12'),
      comment: 'Хорошее следование процедурам'
    }
  })

  await prisma.pilotCompetencyScore.create({
    data: {
      pilotId: poletaevPilot.id,
      instructorId: mentor.id,
      competencyCode: CompetencyCode.FPA,
      sourceType: 'EVAL',
      score: 3,
      date: new Date('2024-03-12'),
      comment: 'Удовлетворительное использование автоматики'
    }
  })

  await prisma.pilotCompetencyScore.create({
    data: {
      pilotId: poletaevPilot.id,
      instructorId: mentor.id,
      competencyCode: CompetencyCode.FPM,
      sourceType: 'EVAL',
      score: 3,
      date: new Date('2024-03-12'),
      comment: 'Удовлетворительное ручное пилотирование'
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

  await prisma.pilotCompetencyScore.create({
    data: {
      pilotId: poletaevPilot.id,
      instructorId: mentor.id,
      competencyCode: CompetencyCode.LDR,
      sourceType: 'EVAL',
      score: 3,
      date: new Date('2024-03-12'),
      comment: 'Удовлетворительные лидерские качества'
    }
  })

  await prisma.pilotCompetencyScore.create({
    data: {
      pilotId: poletaevPilot.id,
      instructorId: mentor.id,
      competencyCode: CompetencyCode.WSA,
      sourceType: 'EVAL',
      score: 4,
      date: new Date('2024-03-12'),
      comment: 'Хорошая ситуационная осведомленность'
    }
  })

  await prisma.pilotCompetencyScore.create({
    data: {
      pilotId: poletaevPilot.id,
      instructorId: mentor.id,
      competencyCode: CompetencyCode.WLM,
      sourceType: 'EVAL',
      score: 4,
      date: new Date('2024-03-12'),
      comment: 'Хорошее управление рабочей нагрузкой'
    }
  })

  await prisma.pilotCompetencyScore.create({
    data: {
      pilotId: poletaevPilot.id,
      instructorId: mentor.id,
      competencyCode: CompetencyCode.PSD,
      sourceType: 'EVAL',
      score: 3,
      date: new Date('2024-03-12'),
      comment: 'Удовлетворительные навыки решения проблем'
    }
  })

  // Создаем оценки для Полетаева (AS - Авиационное событие)
  await prisma.pilotCompetencyScore.create({
    data: {
      pilotId: poletaevPilot.id,
      instructorId: mentor.id,
      competencyCode: CompetencyCode.KNO,
      sourceType: 'AS',
      score: 3,
      date: new Date('2024-01-25'),
      comment: 'Удовлетворительное применение знаний в нештатной ситуации'
    }
  })

  await prisma.pilotCompetencyScore.create({
    data: {
      pilotId: poletaevPilot.id,
      instructorId: mentor.id,
      competencyCode: CompetencyCode.PRO,
      sourceType: 'AS',
      score: 3,
      date: new Date('2024-01-25'),
      comment: 'Удовлетворительное следование процедурам в критической ситуации'
    }
  })

  await prisma.pilotCompetencyScore.create({
    data: {
      pilotId: poletaevPilot.id,
      instructorId: mentor.id,
      competencyCode: CompetencyCode.FPA,
      sourceType: 'AS',
      score: 2,
      date: new Date('2024-01-25'),
      comment: 'Необходимо улучшить использование автоматики в нештатных ситуациях'
    }
  })

  await prisma.pilotCompetencyScore.create({
    data: {
      pilotId: poletaevPilot.id,
      instructorId: mentor.id,
      competencyCode: CompetencyCode.FPM,
      sourceType: 'AS',
      score: 4,
      date: new Date('2024-01-25'),
      comment: 'Хорошее ручное пилотирование в нештатной ситуации'
    }
  })

  await prisma.pilotCompetencyScore.create({
    data: {
      pilotId: poletaevPilot.id,
      instructorId: mentor.id,
      competencyCode: CompetencyCode.COM,
      sourceType: 'AS',
      score: 2,
      date: new Date('2024-01-25'),
      comment: 'Недостаточная коммуникация в критической ситуации'
    }
  })

  await prisma.pilotCompetencyScore.create({
    data: {
      pilotId: poletaevPilot.id,
      instructorId: mentor.id,
      competencyCode: CompetencyCode.LDR,
      sourceType: 'AS',
      score: 3,
      date: new Date('2024-01-25'),
      comment: 'Удовлетворительные лидерские качества в критической ситуации'
    }
  })

  await prisma.pilotCompetencyScore.create({
    data: {
      pilotId: poletaevPilot.id,
      instructorId: mentor.id,
      competencyCode: CompetencyCode.WSA,
      sourceType: 'AS',
      score: 3,
      date: new Date('2024-01-25'),
      comment: 'Удовлетворительная ситуационная осведомленность в критической ситуации'
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
