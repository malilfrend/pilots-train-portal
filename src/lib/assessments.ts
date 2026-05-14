import prisma from '@/lib/prisma'
import { CompetencyCode } from '@/types/assessment'
import { ALL_CODES } from '@/lib/exerciseSelection'

/**
 * Получает данные пилота по ID профиля
 */
export async function getPilotByProfileId(profileId: number) {
  return await prisma.pilot.findUnique({
    where: { profileId },
  })
}

/**
 * Возвращает «последние» оценки пилота по компетенциям —
 * берёт самые свежие SessionScore по дате сессии (включая legacy-сессии).
 */
export async function getLatestPilotScores(
  pilotId: number
): Promise<Record<CompetencyCode, number | null>> {
  const rows = await prisma.sessionScore.findMany({
    where: { pilotId },
    include: { session: { select: { date: true, id: true } } },
  })

  const latest = new Map<CompetencyCode, { date: Date; sessionId: number; score: number }>()
  for (const r of rows) {
    const code = r.competencyCode as CompetencyCode
    const prev = latest.get(code)
    if (
      !prev ||
      r.session.date > prev.date ||
      (r.session.date.getTime() === prev.date.getTime() && r.session.id > prev.sessionId)
    ) {
      latest.set(code, { date: r.session.date, sessionId: r.session.id, score: r.score })
    }
  }

  const result = {} as Record<CompetencyCode, number | null>
  for (const code of ALL_CODES) {
    result[code as CompetencyCode] = latest.get(code as CompetencyCode)?.score ?? null
  }
  return result
}
