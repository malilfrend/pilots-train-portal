import prisma from '@/lib/prisma'
import { CompetencyCode } from '@/types/assessment'

/**
 * Получает данные пилота по ID профиля
 */
export async function getPilotByProfileId(profileId: number) {
  return await prisma.pilot.findUnique({
    where: { profileId },
  })
}

/**
 * Получает оценки пилота по компетенциям
 * Возвращает Record<CompetencyCode, number | null>
 */
export async function getPilotAssessments(
  pilotId: number
): Promise<Record<CompetencyCode, number | null>> {
  const scores = await prisma.pilotCompetencyScore.findMany({
    where: { pilotId },
    select: {
      competencyCode: true,
      score: true,
    },
  })

  const allCodes: CompetencyCode[] = ['PRO', 'COM', 'FPA', 'FPM', 'LTW', 'PSD', 'SAW', 'WLM']

  const result = {} as Record<CompetencyCode, number | null>
  for (const code of allCodes) {
    const found = scores.find((s) => s.competencyCode === code)
    result[code] = found ? found.score : null
  }

  return result
}
