import prisma from '@/lib/prisma'
import { CompetencyCode } from '@/types/assessment'

/**
 * Получает веса компетенций из базы данных
 */
export async function getCompetencyWeights() {
  const weights = await prisma.competencyWeight.findMany()

  // Группируем веса по компетенциям
  const groupedWeights = weights.reduce(
    (acc, weight) => {
      if (!acc[weight.competencyCode as CompetencyCode]) {
        acc[weight.competencyCode as CompetencyCode] = {}
      }

      acc[weight.competencyCode as CompetencyCode][weight.sourceType] = weight.weight

      return acc
    },
    {} as Record<CompetencyCode, Record<string, number>>
  )

  return groupedWeights
}
