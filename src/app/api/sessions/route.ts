import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { CompetencyCode } from '@prisma/client'
import { ALL_CODES } from '@/lib/exerciseSelection'

type IncomingScore = {
  competencyCode: CompetencyCode
  score: number
  comment?: string | null
}

type IncomingExercise = {
  exerciseId: number
  name: string
  executionTime: number
  value: number
  pilot?: number | null
  role?: 'PF' | 'PM' | null
  forBothPilots?: boolean
}

function isValidScoreArray(value: unknown): value is IncomingScore[] {
  if (!Array.isArray(value)) return false
  return value.every(
    (s) =>
      s &&
      typeof s === 'object' &&
      typeof (s as IncomingScore).competencyCode === 'string' &&
      ALL_CODES.includes((s as IncomingScore).competencyCode) &&
      typeof (s as IncomingScore).score === 'number' &&
      (s as IncomingScore).score >= 2 &&
      (s as IncomingScore).score <= 5
  )
}

function isValidExerciseArray(value: unknown): value is IncomingExercise[] {
  if (!Array.isArray(value)) return false
  return value.every(
    (e) =>
      e &&
      typeof e === 'object' &&
      typeof (e as IncomingExercise).exerciseId === 'number' &&
      typeof (e as IncomingExercise).name === 'string' &&
      typeof (e as IncomingExercise).executionTime === 'number' &&
      typeof (e as IncomingExercise).value === 'number'
  )
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value
    if (!token) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })

    const payload = await verifyToken(token)
    if (!payload) return NextResponse.json({ error: 'Недействительный токен' }, { status: 401 })

    if (payload.roleType !== 'INSTRUCTOR') {
      return NextResponse.json(
        { error: 'Только инструкторы могут создавать сессии' },
        { status: 403 }
      )
    }

    const instructor = await prisma.instructor.findUnique({
      where: { profileId: payload.id as number },
    })
    if (!instructor) {
      return NextResponse.json({ error: 'Инструктор не найден' }, { status: 404 })
    }

    const data = await request.json()
    const { pilot1Id, pilot2Id, T, pilot1Scores, pilot2Scores, exercises, totalValue } = data

    if (typeof pilot1Id !== 'number' || typeof pilot2Id !== 'number') {
      return NextResponse.json({ error: 'Неверный формат pilot1Id/pilot2Id' }, { status: 400 })
    }
    if (pilot1Id === pilot2Id) {
      return NextResponse.json({ error: 'Пилоты должны быть разными' }, { status: 400 })
    }
    if (typeof T !== 'number' || T < 1) {
      return NextResponse.json({ error: 'Неверный формат T' }, { status: 400 })
    }
    if (!isValidScoreArray(pilot1Scores) || !isValidScoreArray(pilot2Scores)) {
      return NextResponse.json({ error: 'Неверный формат оценок' }, { status: 400 })
    }
    if (!isValidExerciseArray(exercises)) {
      return NextResponse.json({ error: 'Неверный формат упражнений' }, { status: 400 })
    }
    if (typeof totalValue !== 'number' || totalValue < 0) {
      return NextResponse.json({ error: 'Неверный формат totalValue' }, { status: 400 })
    }

    const created = await prisma.$transaction(async (tx) => {
      const session = await tx.session.create({
        data: {
          instructorId: instructor.id,
          pilot1Id,
          pilot2Id,
          totalTime: Math.floor(T),
          totalValue: Math.floor(totalValue),
        },
      })

      const scoreRows = [
        ...pilot1Scores.map((s) => ({
          sessionId: session.id,
          pilotId: pilot1Id,
          competencyCode: s.competencyCode,
          score: s.score,
          comment: s.comment ?? null,
        })),
        ...pilot2Scores.map((s) => ({
          sessionId: session.id,
          pilotId: pilot2Id,
          competencyCode: s.competencyCode,
          score: s.score,
          comment: s.comment ?? null,
        })),
      ]
      if (scoreRows.length > 0) {
        await tx.sessionScore.createMany({ data: scoreRows })
      }

      if (exercises.length > 0) {
        await tx.sessionExercise.createMany({
          data: exercises.map((ex, idx) => ({
            sessionId: session.id,
            order: idx,
            exerciseId: ex.exerciseId,
            name: ex.name,
            executionTime: Math.floor(ex.executionTime),
            value: Math.floor(ex.value),
            pilot: ex.pilot ?? null,
            role: ex.role ?? null,
            forBothPilots: !!ex.forBothPilots,
          })),
        })
      }

      return session
    })

    return NextResponse.json({ id: created.id, date: created.date })
  } catch (error) {
    console.error('Error creating session:', error)
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value
    if (!token) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })

    const payload = await verifyToken(token)
    if (!payload) return NextResponse.json({ error: 'Недействительный токен' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const pilotIdParam = searchParams.get('pilotId')
    if (!pilotIdParam || isNaN(Number(pilotIdParam))) {
      return NextResponse.json({ error: 'Неверный формат pilotId' }, { status: 400 })
    }
    const pilotId = Number(pilotIdParam)

    const sessions = await prisma.session.findMany({
      where: {
        isLegacy: false,
        OR: [{ pilot1Id: pilotId }, { pilot2Id: pilotId }],
      },
      orderBy: { date: 'desc' },
      include: {
        instructor: { include: { profile: { select: { firstName: true, lastName: true } } } },
        pilot1: { include: { profile: { select: { firstName: true, lastName: true } } } },
        pilot2: { include: { profile: { select: { firstName: true, lastName: true } } } },
      },
    })

    const result = sessions.map((s) => {
      const partner = s.pilot1Id === pilotId ? s.pilot2 : s.pilot1
      return {
        id: s.id,
        date: s.date,
        totalTime: s.totalTime,
        totalValue: s.totalValue,
        instructor: {
          firstName: s.instructor.profile.firstName,
          lastName: s.instructor.profile.lastName,
        },
        partner: {
          id: partner.id,
          firstName: partner.profile.firstName,
          lastName: partner.profile.lastName,
        },
      }
    })

    return NextResponse.json({ sessions: result })
  } catch (error) {
    console.error('Error listing sessions:', error)
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}
