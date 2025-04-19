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

/**
 * Обновляет веса компетенций в базе данных
 * @param newWeights - объект вида { [competencyCode]: { [sourceType]: weight } }
 */
export async function updateCompetencyWeights(newWeights: Record<string, Record<string, number>>) {
  const operations = []
  for (const competencyCode in newWeights) {
    for (const sourceType in newWeights[competencyCode]) {
      const weight = newWeights[competencyCode][sourceType]
      operations.push(
        prisma.competencyWeight.upsert({
          where: {
            competencyCode_sourceType: {
              competencyCode: competencyCode as CompetencyCode,
              sourceType: sourceType as any, // AssessmentSourceType, но prisma может ожидать enum
            },
          },
          update: { weight },
          create: {
            competencyCode: competencyCode as CompetencyCode,
            sourceType: sourceType as any, // AssessmentSourceType
            weight,
          },
        })
      )
    }
  }
  await prisma.$transaction(operations)
  return true
}
