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
      'KNO',
      'PRO',
      'FPA',
      'FPM',
      'COM',
      'LDR',
      'WSA',
      'WLM',
      'PSD',
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
    console.log('generalScores :', generalScores)

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
