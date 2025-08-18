import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { ASSESSMENT_TYPES, CompetencyCode } from '@/types/assessment'
import {
  getPilotByProfileId,
  getPilotAssessments,
  formatAssessments,
  groupAssessmentsByType,
} from '@/lib/assessments'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Недействительный токен' }, { status: 401 })
    }

    const userProfileId = payload.id as number
    const roleType = payload.roleType as string

    // Если пользователь - инструктор, возвращаем ошибку
    if (roleType === 'INSTRUCTOR') {
      return NextResponse.json(
        {
          error: 'Инструкторы не имеют оценок компетенций',
        },
        { status: 403 }
      )
    }

    // Находим пилота по профилю пользователя
    const pilot = await getPilotByProfileId(userProfileId)

    if (!pilot) {
      return NextResponse.json({ error: 'Пилот не найден' }, { status: 404 })
    }

    // Получаем все оценки пилота с компетенциями
    const assessments = await getPilotAssessments(pilot.id)

    // Преобразуем данные для фронтенда
    const formattedAssessments = formatAssessments(assessments)

    // Группируем оценки по типу и берем последнюю для каждого типа
    const assessmentsByType = groupAssessmentsByType(formattedAssessments, ASSESSMENT_TYPES)

    // Вычисляем средние значения для общей таблицы компетенций
    const allCompetencyScores: any[] = assessments.flatMap((a: any) => a.competencyScores)

    const competencyCodes: CompetencyCode[] = [
      'PRO',
      'COM',
      'FPA',
      'FPM',
      'LTW',
      'PSD',
      'SAW',
      'WLM',
    ]
    const generalScores = competencyCodes.map((code) => {
      const scores = allCompetencyScores.filter((s) => s.competencyCode === code)
      const avgScore =
        scores.length > 0 ? scores.reduce((sum, s) => sum + s.score, 0) / scores.length : null

      return {
        competencyCode: code,
        score: avgScore,
      }
    })

    const generalAssessment = {
      id: 'general',
      type: 'EVAL',
      date: new Date().toISOString(),
      competencyScores: generalScores,
    }

    return NextResponse.json({
      assessments: assessmentsByType,
      generalAssessment,
    })
  } catch (error) {
    console.error('Error fetching assessments:', error)
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}

// Создание новой оценки
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Недействительный токен' }, { status: 401 })
    }

    const userProfileId = payload.id as number
    const roleType = payload.roleType as string

    // Только инструкторы могут создавать оценки
    if (roleType !== 'INSTRUCTOR') {
      return NextResponse.json(
        {
          error: 'Доступ запрещен. Только инструкторы могут создавать оценки',
        },
        { status: 403 }
      )
    }

    // Получаем данные инструктора
    const instructor = await prisma.instructor.findUnique({
      where: { profileId: userProfileId },
    })

    if (!instructor) {
      return NextResponse.json({ error: 'Инструктор не найден' }, { status: 404 })
    }

    // Получаем данные запроса
    const data = await request.json()
    const { pilotId, type, date, competencyScores, comment } = data

    // Валидация данных
    if (!pilotId || !type || !date || !competencyScores || !Array.isArray(competencyScores)) {
      return NextResponse.json({ error: 'Неверный формат данных оценки' }, { status: 400 })
    }

    // Проверяем существование пилота
    const pilot = await prisma.pilot.findUnique({
      where: { id: pilotId },
    })

    if (!pilot) {
      return NextResponse.json({ error: 'Пилот не найден' }, { status: 404 })
    }

    // Создаем записи для каждой компетенции
    const createPromises = competencyScores
      .filter((item) => item.score !== null) // Отфильтровываем только компетенции с оценками
      .map((item) =>
        prisma.pilotCompetencyScore.create({
          data: {
            pilotId,
            instructorId: instructor.id,
            competencyCode: item.competencyCode,
            sourceType: type,
            score: item.score as number,
            date: new Date(date),
            comment: comment || null,
          },
        })
      )

    if (createPromises.length === 0) {
      return NextResponse.json(
        { error: 'Необходимо указать хотя бы одну оценку компетенции' },
        { status: 400 }
      )
    }

    // Выполняем все запросы на создание в транзакции
    await prisma.$transaction(createPromises)

    return NextResponse.json({
      success: true,
      message: 'Оценка успешно создана',
    })
  } catch (error) {
    console.error('Error creating assessment:', error)
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}

// Обновление существующей оценки
export async function PUT(request: Request) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Недействительный токен' }, { status: 401 })
    }

    const userProfileId = payload.id as number
    const roleType = payload.roleType as string

    // Только инструкторы могут обновлять оценки
    if (roleType !== 'INSTRUCTOR') {
      return NextResponse.json(
        {
          error: 'Доступ запрещен. Только инструкторы могут обновлять оценки',
        },
        { status: 403 }
      )
    }

    // Получаем данные инструктора
    const instructor = await prisma.instructor.findUnique({
      where: { profileId: userProfileId },
    })

    if (!instructor) {
      return NextResponse.json({ error: 'Инструктор не найден' }, { status: 404 })
    }

    // Получаем данные запроса
    const data = await request.json()
    const { pilotId, type, date, competencyScores, comment } = data

    // Валидация данных
    if (!pilotId || !type || !date || !competencyScores || !Array.isArray(competencyScores)) {
      return NextResponse.json({ error: 'Неверный формат данных оценки' }, { status: 400 })
    }

    // Проверяем существование пилота
    const pilot = await prisma.pilot.findUnique({
      where: { id: pilotId },
    })

    if (!pilot) {
      return NextResponse.json({ error: 'Пилот не найден' }, { status: 404 })
    }

    // Получаем существующие записи для данного пилота и типа оценки
    const existingScores = await prisma.pilotCompetencyScore.findMany({
      where: {
        pilotId,
        sourceType: type,
      },
    })

    // Создаем транзакцию для обновления всех записей
    const operations = []

    // Сначала удаляем все существующие оценки данного типа
    operations.push(
      prisma.pilotCompetencyScore.deleteMany({
        where: {
          pilotId,
          sourceType: type,
        },
      })
    )

    // Затем создаем новые записи для каждой компетенции
    competencyScores
      .filter((item) => item.score !== null) // Отфильтровываем только компетенции с оценками
      .forEach((item) => {
        operations.push(
          prisma.pilotCompetencyScore.create({
            data: {
              pilotId,
              instructorId: instructor.id,
              competencyCode: item.competencyCode,
              sourceType: type,
              score: item.score as number,
              date: new Date(date),
              comment: comment || null,
            },
          })
        )
      })

    if (operations.length === 1) {
      // Если только операция удаления
      return NextResponse.json(
        { error: 'Необходимо указать хотя бы одну оценку компетенции' },
        { status: 400 }
      )
    }

    // Выполняем все операции в транзакции
    await prisma.$transaction(operations)

    return NextResponse.json({
      success: true,
      message: 'Оценка успешно обновлена',
    })
  } catch (error) {
    console.error('Error updating assessment:', error)
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}
