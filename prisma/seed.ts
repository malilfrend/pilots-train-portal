import { PrismaClient, UserRole, CompetencyCode, AssessmentSourceType } from '@prisma/client'
import { hash } from 'bcrypt'
import * as XLSX from 'xlsx'
import path from 'path'

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
    // PRO - Procedures
    { competencyCode: CompetencyCode.PRO, sourceType: AssessmentSourceType.PC, weight: 0.3 },
    { competencyCode: CompetencyCode.PRO, sourceType: AssessmentSourceType.FDM, weight: 0.2 },
    { competencyCode: CompetencyCode.PRO, sourceType: AssessmentSourceType.EVAL, weight: 0.3 },
    { competencyCode: CompetencyCode.PRO, sourceType: AssessmentSourceType.ASR, weight: 0.2 },
    // COM - Communication
    { competencyCode: CompetencyCode.COM, sourceType: AssessmentSourceType.PC, weight: 0.25 },
    { competencyCode: CompetencyCode.COM, sourceType: AssessmentSourceType.FDM, weight: 0.2 },
    { competencyCode: CompetencyCode.COM, sourceType: AssessmentSourceType.EVAL, weight: 0.35 },
    { competencyCode: CompetencyCode.COM, sourceType: AssessmentSourceType.ASR, weight: 0.2 },
    // FPA - Flight Path Automation
    { competencyCode: CompetencyCode.FPA, sourceType: AssessmentSourceType.PC, weight: 0.25 },
    { competencyCode: CompetencyCode.FPA, sourceType: AssessmentSourceType.FDM, weight: 0.3 },
    { competencyCode: CompetencyCode.FPA, sourceType: AssessmentSourceType.EVAL, weight: 0.25 },
    { competencyCode: CompetencyCode.FPA, sourceType: AssessmentSourceType.ASR, weight: 0.2 },
    // FPM - Flight Path Manual
    { competencyCode: CompetencyCode.FPM, sourceType: AssessmentSourceType.PC, weight: 0.3 },
    { competencyCode: CompetencyCode.FPM, sourceType: AssessmentSourceType.FDM, weight: 0.25 },
    { competencyCode: CompetencyCode.FPM, sourceType: AssessmentSourceType.EVAL, weight: 0.25 },
    { competencyCode: CompetencyCode.FPM, sourceType: AssessmentSourceType.ASR, weight: 0.2 },
    // LTW - Leadership and Teamwork
    { competencyCode: CompetencyCode.LTW, sourceType: AssessmentSourceType.PC, weight: 0.2 },
    { competencyCode: CompetencyCode.LTW, sourceType: AssessmentSourceType.FDM, weight: 0.15 },
    { competencyCode: CompetencyCode.LTW, sourceType: AssessmentSourceType.EVAL, weight: 0.4 },
    { competencyCode: CompetencyCode.LTW, sourceType: AssessmentSourceType.ASR, weight: 0.25 },
    // PSD - Problem Solving and Decision
    { competencyCode: CompetencyCode.PSD, sourceType: AssessmentSourceType.PC, weight: 0.25 },
    { competencyCode: CompetencyCode.PSD, sourceType: AssessmentSourceType.FDM, weight: 0.15 },
    { competencyCode: CompetencyCode.PSD, sourceType: AssessmentSourceType.EVAL, weight: 0.3 },
    { competencyCode: CompetencyCode.PSD, sourceType: AssessmentSourceType.ASR, weight: 0.3 },
    // SAW - Situational Awareness
    { competencyCode: CompetencyCode.SAW, sourceType: AssessmentSourceType.PC, weight: 0.25 },
    { competencyCode: CompetencyCode.SAW, sourceType: AssessmentSourceType.FDM, weight: 0.2 },
    { competencyCode: CompetencyCode.SAW, sourceType: AssessmentSourceType.EVAL, weight: 0.3 },
    { competencyCode: CompetencyCode.SAW, sourceType: AssessmentSourceType.ASR, weight: 0.25 },
    // WLM - Workload Management
    { competencyCode: CompetencyCode.WLM, sourceType: AssessmentSourceType.PC, weight: 0.25 },
    { competencyCode: CompetencyCode.WLM, sourceType: AssessmentSourceType.FDM, weight: 0.2 },
    { competencyCode: CompetencyCode.WLM, sourceType: AssessmentSourceType.EVAL, weight: 0.3 },
    { competencyCode: CompetencyCode.WLM, sourceType: AssessmentSourceType.ASR, weight: 0.25 },
    // KNO - Knowledge
    { competencyCode: CompetencyCode.KNO, sourceType: AssessmentSourceType.PC, weight: 0.35 },
    { competencyCode: CompetencyCode.KNO, sourceType: AssessmentSourceType.FDM, weight: 0.15 },
    { competencyCode: CompetencyCode.KNO, sourceType: AssessmentSourceType.EVAL, weight: 0.35 },
    { competencyCode: CompetencyCode.KNO, sourceType: AssessmentSourceType.ASR, weight: 0.15 },
  ]

  for (const weight of competencyWeights) {
    await prisma.competencyWeight.create({
      data: weight
    })
  }

  // Компетенции и источники для генерации оценок
  const allCompetencyCodes = [
    CompetencyCode.PRO,
    CompetencyCode.COM,
    CompetencyCode.FPA,
    CompetencyCode.FPM,
    CompetencyCode.LTW,
    CompetencyCode.PSD,
    CompetencyCode.SAW,
    CompetencyCode.WLM,
    CompetencyCode.KNO,
  ];
  const allSources = [
    AssessmentSourceType.PC,
    AssessmentSourceType.FDM,
    AssessmentSourceType.EVAL,
    AssessmentSourceType.ASR
  ];

  // Генерируем оценки для каждого пилота, источника и компетенции
  for (const pilot of [vertoletovPilot, poletaevPilot]) {
    for (const sourceType of allSources) {
      for (const code of allCompetencyCodes) {
        await prisma.pilotCompetencyScore.create({
          data: {
            pilotId: pilot.id,
            instructorId: mentor.id,
            competencyCode: code,
            sourceType: sourceType,
            score: Math.floor(Math.random() * 4) + 2, // случайная оценка 2-5
            date: new Date('2024-02-10'),
            comment: `Тестовая оценка для ${code} (${sourceType})`,
          }
        })
      }
    }
  }

  console.log('База данных успешно заполнена тестовыми пользователями и оценками')

  console.log('Начинаем загрузку упражнений из Excel…')

  // Путь к файлу: поправьте, если seed.ts лежит не рядом с Excel'ем
  const filePath = path.join(__dirname, 'exercises.xlsx')
  const workbook = XLSX.readFile(filePath)
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const rows: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet, { defval: null })

  const competencyCols = ['PRO','COM','FPA','FPM','LTW','PSD','SAW','WLM','KNO']

  for (const row of rows) {
    const name = row.Name?.toString().trim()
    if (!name) continue

    // Выбираем все колонки‑компетенции, где в ячейке стоит отметка (например 'x')
    const comps = competencyCols.filter(code => {
      const v = row[code]
      return v !== null && (v?.toString()?.toLowerCase() === 'x' || v === true)
    })

    // Создаём упражнение с вложенной вставкой компетенций
    const exercise = await prisma.exercise.create({
      data: {
        name,
        competencies: {
          create: comps.map(code => ({
            competencyCode: code as CompetencyCode
          }))
        }
      }
    })

    console.log(`Добавлено упражнение #${exercise.id}: "${name}" → [${comps.join(', ')}]`)
  }

  console.log('Все упражнения загружены.')
}

main()
  .catch((e) => {
    console.error('Ошибка заполнения базы данных:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
