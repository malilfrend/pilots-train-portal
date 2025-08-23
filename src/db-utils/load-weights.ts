import { AssessmentSourceType, CompetencyCode } from '@prisma/client'
import prisma from '@/lib/prisma'

// Функция для загрузки весов компетенций
export async function loadWeights(): Promise<
  Record<CompetencyCode, Record<AssessmentSourceType, number>>
> {
  try {
    const weights = await prisma.competencyWeight.findMany()

    const weightMap = {} as Record<CompetencyCode, Record<AssessmentSourceType, number>>

    weights.forEach((weight) => {
      if (!weightMap[weight.competencyCode]) {
        weightMap[weight.competencyCode] = {} as Record<AssessmentSourceType, number>
      }
      weightMap[weight.competencyCode][weight.sourceType] = weight.weight
    })

    return weightMap
  } catch (error) {
    console.error('Error loading competency weights:', error)
    return {} as Record<CompetencyCode, Record<AssessmentSourceType, number>>
  }
}
