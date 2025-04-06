import prisma from '@/lib/prisma'
import { AssessmentSourceType } from '@/types/assessment'

/**
 * Получает данные пилота по ID профиля
 */
export async function getPilotByProfileId(profileId: number) {
  return await prisma.pilot.findUnique({
    where: { profileId },
  })
}

/**
 * Получает оценки пилота с компетенциями
 */
export async function getPilotAssessments(pilotId: number) {
  // Получаем оценки из новой таблицы pilotCompetencyScore
  const competencyScores = await prisma.pilotCompetencyScore.findMany({
    where: { pilotId },
    orderBy: {
      date: 'desc',
    },
    include: {
      instructor: {
        include: {
          profile: true,
        },
      },
    },
  })

  // Группируем оценки по типу источника и дате
  const groupedScores = competencyScores.reduce(
    (acc, score) => {
      const key = `${score.sourceType}-${score.date.toISOString().split('T')[0]}`
      if (!acc[key]) {
        acc[key] = {
          id: key,
          type: score.sourceType,
          date: score.date,
          instructorComment: score.comment || '',
          instructorId: score.instructorId,
          instructorName: score.instructor?.profile
            ? `${score.instructor.profile.firstName} ${score.instructor.profile.lastName}`
            : 'Неизвестный инструктор',
          competencyScores: [],
        }
      }

      acc[key].competencyScores.push({
        competencyCode: score.competencyCode,
        score: score.score,
      })

      return acc
    },
    {} as Record<string, any>
  )

  return Object.values(groupedScores)
}

/**
 * Форматирует оценки для фронтенда
 */
export function formatAssessments(assessments: any[]) {
  return assessments.map((assessment) => ({
    id: assessment.id.toString(),
    type: assessment.type as AssessmentSourceType,
    date: assessment.date.toISOString(),
    instructorComment: assessment.instructorComment,
    instructorName: assessment.instructorName,
    competencyScores: assessment.competencyScores.map((score: any) => ({
      competencyCode: score.competencyCode,
      score: score.score,
    })),
  }))
}

/**
 * Группирует оценки по типу и берет последнюю для каждого типа
 */
export function groupAssessmentsByType(
  formattedAssessments: any[],
  assessmentTypes: AssessmentSourceType[]
) {
  return assessmentTypes.reduce(
    (acc, type) => {
      const typeAssessments = formattedAssessments.filter((a) => a.type === type)
      if (typeAssessments.length > 0) {
        acc[type] = typeAssessments[0] // Берем самую свежую оценку
      }
      return acc
    },
    {} as Record<AssessmentSourceType, any>
  )
}
