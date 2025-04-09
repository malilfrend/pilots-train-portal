import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { ASSESSMENT_TYPES } from '@/types/assessment'
import { getPilotAssessments, formatAssessments, groupAssessmentsByType } from '@/lib/assessments'
import prisma from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const pilotId = body.pilotId

    if (isNaN(pilotId)) {
      return NextResponse.json({ error: 'Некорректный ID пилота' }, { status: 400 })
    }

    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Недействительный токен' }, { status: 401 })
    }

    const roleType = payload.roleType as string

    // Проверяем, что пользователь - инструктор
    if (roleType !== 'INSTRUCTOR') {
      return NextResponse.json(
        {
          error: 'Доступ запрещен. Только инструкторы могут получать оценки пилотов',
        },
        { status: 403 }
      )
    }

    // Проверяем существование пилота
    const pilot = await prisma.pilot.findUnique({
      where: { id: pilotId },
    })

    if (!pilot) {
      return NextResponse.json({ error: 'Пилот не найден' }, { status: 404 })
    }

    // Получаем все оценки пилота с компетенциями
    const assessments = await getPilotAssessments(pilotId)

    // Преобразуем данные для фронтенда
    const formattedAssessments = formatAssessments(assessments)

    // Группируем оценки по типу и берем последнюю для каждого типа
    const assessmentsByType = groupAssessmentsByType(formattedAssessments, ASSESSMENT_TYPES)

    return NextResponse.json({
      assessments: assessmentsByType,
    })
  } catch (error) {
    console.error('Error fetching pilot assessments:', error)
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}
