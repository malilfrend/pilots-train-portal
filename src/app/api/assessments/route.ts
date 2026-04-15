import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { CompetencyCode } from '@/types/assessment'
import { getPilotAssessments } from '@/lib/assessments'
import prisma from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const pilotId = Number(searchParams.get('pilotId') ?? 0)

    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Недействительный токен' }, { status: 401 })
    }

    const scores = await getPilotAssessments(pilotId)

    return NextResponse.json({ scores })
  } catch (error) {
    console.error('Error fetching assessments:', error)
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}

// Создание/обновление оценок пилота (upsert по competencyCode)
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

    if (roleType !== 'INSTRUCTOR') {
      return NextResponse.json(
        { error: 'Доступ запрещен. Только инструкторы могут создавать оценки' },
        { status: 403 }
      )
    }

    const instructor = await prisma.instructor.findUnique({
      where: { profileId: userProfileId },
    })

    if (!instructor) {
      return NextResponse.json({ error: 'Инструктор не найден' }, { status: 404 })
    }

    const data = await request.json()
    const { pilotId, competencyScores, comment } = data

    if (!pilotId || !competencyScores || !Array.isArray(competencyScores)) {
      return NextResponse.json({ error: 'Неверный формат данных оценки' }, { status: 400 })
    }

    const pilot = await prisma.pilot.findUnique({
      where: { id: pilotId },
    })

    if (!pilot) {
      return NextResponse.json({ error: 'Пилот не найден' }, { status: 404 })
    }

    const operations = competencyScores
      .filter(
        (item: { competencyCode: CompetencyCode; score: number | null }) => item.score !== null
      )
      .map((item: { competencyCode: CompetencyCode; score: number }) =>
        prisma.pilotCompetencyScore.upsert({
          where: {
            pilotId_competencyCode: {
              pilotId,
              competencyCode: item.competencyCode,
            },
          },
          update: {
            score: item.score,
            instructorId: instructor.id,
            date: new Date(),
            comment: comment || null,
          },
          create: {
            pilotId,
            instructorId: instructor.id,
            competencyCode: item.competencyCode,
            score: item.score,
            date: new Date(),
            comment: comment || null,
          },
        })
      )

    if (operations.length === 0) {
      return NextResponse.json(
        { error: 'Необходимо указать хотя бы одну оценку компетенции' },
        { status: 400 }
      )
    }

    await prisma.$transaction(operations)

    return NextResponse.json({
      success: true,
      message: 'Оценки успешно сохранены',
    })
  } catch (error) {
    console.error('Error saving assessments:', error)
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}
