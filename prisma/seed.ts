import { PrismaClient, UserRole, CompetencyCode } from '@prisma/client'
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
      position: 'Командир вертолёта Ми-8',
      flightHours: 7500,
      aircraftType: 'Ми-8',
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
      position: 'Второй пилот Airbus A320',
      flightHours: 4200,
      aircraftType: 'Airbus A320',
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
      position: 'Старший инструктор',
      flightHours: 15000,
      aircraftType: 'Boeing 737',
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

  // Компетенции для генерации оценок
  const allCompetencyCodes = [
    CompetencyCode.PRO,
    CompetencyCode.COM,
    CompetencyCode.FPA,
    CompetencyCode.FPM,
    CompetencyCode.LTW,
    CompetencyCode.PSD,
    CompetencyCode.SAW,
    CompetencyCode.WLM,
  ];

  // Генерируем оценки для каждого пилота и компетенции (одна оценка на компетенцию)
  for (const pilot of [vertoletovPilot, poletaevPilot]) {
    for (const code of allCompetencyCodes) {
      await prisma.pilotCompetencyScore.create({
        data: {
          pilotId: pilot.id,
          instructorId: mentor.id,
          competencyCode: code,
          score: Math.floor(Math.random() * 4) + 2, // случайная оценка 2-5
          date: new Date('2024-02-10'),
          comment: `Тестовая оценка для ${code}`,
        }
      })
    }
  }

  console.log('База данных успешно заполнена тестовыми пользователями и оценками')

  console.log('Начинаем загрузку упражнений из Excel…')

  // Путь к файлу: поправьте, если seed.ts лежит не рядом с Excel'ем
  const filePath = path.join(__dirname, 'exercises.xlsx')
  const workbook = XLSX.readFile(filePath)
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const rows: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet, { defval: null })

  const competencyCols = ['PRO','COM','FPA','FPM','LTW','PSD','SAW','WLM']

  for (const row of rows) {
    const name = row.Name?.toString().trim()
    if (!name) continue

    // Выбираем все колонки‑компетенции, где в ячейке стоит отметка (например 'x')
    const comps = competencyCols.filter(code => {
      const v = row[code]
      return v !== null && (v?.toString()?.toLowerCase() === 'x' || v === true)
    })

    const timeRaw = row.Time
    const executionTime =
      timeRaw === null || timeRaw === undefined || timeRaw === ''
        ? null
        : Number(timeRaw)

    // Создаём упражнение с вложенной вставкой компетенций
    const exercise = await prisma.exercise.create({
      data: {
        name,
        executionTime,
        competencies: {
          create: comps.map(code => ({
            competencyCode: code as CompetencyCode
          }))
        }
      }
    })

    console.log(`Добавлено упражнение #${exercise.id}: "${name}" (${executionTime ?? '—'} мин) → [${comps.join(', ')}]`)
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
