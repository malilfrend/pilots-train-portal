import prisma from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { AssessmentType } from '@/types/assessment'

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
  return await prisma.assessment.findMany({
    where: { pilotId },
    include: {
      competencyScores: true,
    },
    orderBy: {
      date: 'desc',
    },
  })
}

/**
 * Форматирует оценки для фронтенда
 */
export function formatAssessments(assessments: any[]) {
  return assessments.map((assessment) => ({
    id: assessment.id.toString(),
    type: assessment.type as AssessmentType,
    date: assessment.date.toISOString(),
    instructorComment: assessment.instructorComment,
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
  assessmentTypes: AssessmentType[]
) {
  return assessmentTypes.reduce(
    (acc, type) => {
      const typeAssessments = formattedAssessments.filter((a) => a.type === type)
      if (typeAssessments.length > 0) {
        acc[type] = typeAssessments[0] // Берем самую свежую оценку
      }
      return acc
    },
    {} as Record<AssessmentType, any>
  )
}
