import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { AssessmentType, ASSESSMENT_TYPES } from '@/types/assessment'

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

    const userId = payload.id as number

    // Получаем все оценки пользователя с компетенциями
    const assessments = await prisma.assessment.findMany({
      where: { userId },
      include: {
        competencyScores: true,
      },
      orderBy: {
        date: 'desc',
      },
    })

    // Преобразуем данные для фронтенда
    const formattedAssessments = assessments.map((assessment) => ({
      id: assessment.id.toString(),
      type: assessment.type as AssessmentType,
      date: assessment.date.toISOString(),
      instructorComment: assessment.instructorComment,
      competencyScores: assessment.competencyScores.map((score) => ({
        competencyCode: score.competencyCode,
        score: score.score,
      })),
    }))

    // Группируем оценки по типу и берем последнюю для каждого типа
    const assessmentsByType = ASSESSMENT_TYPES.reduce(
      (acc, type) => {
        const typeAssessments = formattedAssessments.filter((a) => a.type === type)
        if (typeAssessments.length > 0) {
          acc[type] = typeAssessments[0] // Берем самую свежую оценку
        }
        return acc
      },
      {} as Record<AssessmentType, any>
    )

    // Вычисляем средние значения для общей таблицы компетенций
    const allScores = assessments.flatMap((a) => a.competencyScores)

    const competencyCodes = ['APK', 'COM', 'FPA', 'FPM', 'LTW', 'PSD', 'SAW', 'WLM', 'KNO']
    const generalScores = competencyCodes.map((code) => {
      const scores = allScores.filter((s) => s.competencyCode === code)
      const avgScore =
        scores.length > 0
          ? Math.round(scores.reduce((sum, s) => sum + s.score, 0) / scores.length)
          : null

      return {
        competencyCode: code,
        score: avgScore,
      }
    })

    const generalAssessment = {
      id: 'general',
      type: 'EVAL' as AssessmentType,
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
