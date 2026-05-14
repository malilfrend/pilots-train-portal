import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id: idParam } = await ctx.params
    const id = Number(idParam)
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Неверный формат id' }, { status: 400 })
    }

    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value
    if (!token) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })

    const payload = await verifyToken(token)
    if (!payload) return NextResponse.json({ error: 'Недействительный токен' }, { status: 401 })

    const session = await prisma.session.findUnique({
      where: { id },
      include: {
        instructor: { include: { profile: { select: { firstName: true, lastName: true } } } },
        pilot1: {
          include: { profile: { select: { id: true, firstName: true, lastName: true } } },
        },
        pilot2: {
          include: { profile: { select: { id: true, firstName: true, lastName: true } } },
        },
        scores: true,
        exercises: {
          orderBy: { order: 'asc' },
          include: { exercise: { include: { competencies: true } } },
        },
      },
    })

    if (!session) {
      return NextResponse.json({ error: 'Сессия не найдена' }, { status: 404 })
    }

    // Авторизация: INSTRUCTOR — любая сессия; PILOT — только свои.
    const isInstructor = payload.roleType === 'INSTRUCTOR'
    if (!isInstructor) {
      const pilotId = payload.roleId as number
      if (pilotId !== session.pilot1.id && pilotId !== session.pilot2.id) {
        return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 })
      }
    }

    return NextResponse.json({
      session: {
        id: session.id,
        date: session.date,
        totalTime: session.totalTime,
        totalValue: session.totalValue,
        isLegacy: session.isLegacy,
        instructor: {
          firstName: session.instructor.profile.firstName,
          lastName: session.instructor.profile.lastName,
        },
        pilot1: {
          id: session.pilot1.id,
          firstName: session.pilot1.profile.firstName,
          lastName: session.pilot1.profile.lastName,
        },
        pilot2: {
          id: session.pilot2.id,
          firstName: session.pilot2.profile.firstName,
          lastName: session.pilot2.profile.lastName,
        },
        scores: session.scores.map((s) => ({
          pilotId: s.pilotId,
          competencyCode: s.competencyCode,
          score: s.score,
          comment: s.comment,
        })),
        exercises: session.exercises.map((e) => ({
          order: e.order,
          exerciseId: e.exerciseId,
          name: e.name,
          executionTime: e.executionTime,
          value: e.value,
          pilot: e.pilot,
          role: e.role,
          forBothPilots: e.forBothPilots,
          competencies: e.exercise.competencies.map((c) => c.competencyCode),
        })),
      },
    })
  } catch (error) {
    console.error('Error fetching session:', error)
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}
