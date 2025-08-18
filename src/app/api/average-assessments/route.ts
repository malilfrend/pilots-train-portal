import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { CompetencyCode, AssessmentSourceType, ASSESSMENT_TYPES } from '@/types/assessment'

export type TPilotAverage = {
  pilotId: number
  pilotName: string
  competencyAverages: Record<CompetencyCode, number | null>
}

type Response = {
  pilots?: {
    pilot1?: TPilotAverage
    pilot2?: TPilotAverage
  }
}

// Функция для загрузки весов компетенций
async function loadCompetencyWeights(): Promise<
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

// Функция для получения веса компетенции для источника
function getWeight(
  competencyCode: CompetencyCode,
  sourceType: AssessmentSourceType,
  weights: Record<CompetencyCode, Record<AssessmentSourceType, number>>
): number {
  return weights[competencyCode]?.[sourceType] || 0
}

// Функция для расчета средневзвешенного значения компетенции пилота
function calculateWeightedAverage(
  competencyCode: CompetencyCode,
  pilotScores: Record<AssessmentSourceType, number | null>,
  weights: Record<CompetencyCode, Record<AssessmentSourceType, number>>
): number | null {
  let sum = 0
  let totalWeight = 0

  // Проходим по всем источникам
  ASSESSMENT_TYPES.forEach((sourceType) => {
    const score = pilotScores[sourceType]
    if (score === null) return

    const weight = getWeight(competencyCode, sourceType, weights)
    sum += score * weight
    totalWeight += weight
  })

  return totalWeight > 0 ? Math.round((sum / totalWeight) * 100) / 100 : null
}

// Функция для получения средних оценок пилота по компетенциям
async function getPilotAverages(
  pilotId: number,
  weights: Record<CompetencyCode, Record<AssessmentSourceType, number>>
): Promise<TPilotAverage> {
  // Получаем информацию о пилоте
  const pilot = await prisma.pilot.findUnique({
    where: { id: pilotId },
    include: {
      profile: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
  })

  if (!pilot) {
    throw new Error(`Пилот с id ${pilotId} не найден`)
  }

  // Получаем все оценки пилота
  const scores = await prisma.pilotCompetencyScore.findMany({
    where: { pilotId },
    select: {
      competencyCode: true,
      sourceType: true,
      score: true,
    },
  })

  // Группируем оценки по компетенциям и источникам
  const scoresByCompetency: Record<
    CompetencyCode,
    Record<AssessmentSourceType, number | null>
  > = {} as Record<CompetencyCode, Record<AssessmentSourceType, number | null>>

  // Инициализируем все компетенции и источники
  const allCompetencyCodes: CompetencyCode[] = [
    'PRO',
    'COM',
    'FPA',
    'FPM',
    'LTW',
    'PSD',
    'SAW',
    'WLM',
  ]

  allCompetencyCodes.forEach((competencyCode) => {
    scoresByCompetency[competencyCode] = {} as Record<AssessmentSourceType, number | null>
    ASSESSMENT_TYPES.forEach((sourceType) => {
      scoresByCompetency[competencyCode][sourceType] = null
    })
  })

  // Заполняем реальными оценками
  scores.forEach((score) => {
    // Явно приводим ключ к типу CompetencyCode для корректной типизации
    const competencyCode = score.competencyCode as CompetencyCode
    const sourceType = score.sourceType as AssessmentSourceType
    // Предполагаем, что всеCompetencyCodes инициализированы выше, поэтому проверки не требуется
    scoresByCompetency[competencyCode][sourceType] = score.score
  })

  // Вычисляем средневзвешенные значения для каждой компетенции
  const competencyAverages = {} as Record<CompetencyCode, number | null>

  allCompetencyCodes.forEach((competencyCode) => {
    competencyAverages[competencyCode] = calculateWeightedAverage(
      competencyCode,
      scoresByCompetency[competencyCode],
      weights
    )
  })

  return {
    pilotId,
    pilotName: `${pilot.profile.lastName} ${pilot.profile.firstName}`,
    competencyAverages,
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const pilot1Id = searchParams.get('pilot1Id')
    const pilot2Id = searchParams.get('pilot2Id')

    // Валидация параметров
    if (pilot1Id && isNaN(Number(pilot1Id))) {
      return NextResponse.json({ error: 'Неверный формат pilot1Id' }, { status: 400 })
    }

    if (pilot2Id && isNaN(Number(pilot2Id))) {
      return NextResponse.json({ error: 'Неверный формат pilot2Id' }, { status: 400 })
    }

    // Загружаем веса компетенций
    const weights = await loadCompetencyWeights()

    // Получаем средние оценки пилотов, если их id переданы
    const pilots: { pilot1?: TPilotAverage; pilot2?: TPilotAverage } = {}

    if (pilot1Id) {
      try {
        pilots.pilot1 = await getPilotAverages(Number(pilot1Id), weights)
      } catch {
        return NextResponse.json({ error: 'Пилот 1 не найден' }, { status: 404 })
      }
    }

    if (pilot2Id) {
      try {
        pilots.pilot2 = await getPilotAverages(Number(pilot2Id), weights)
      } catch {
        return NextResponse.json({ error: 'Пилот 2 не найден' }, { status: 404 })
      }
    }

    const response: Response = {
      ...(Object.keys(pilots).length > 0 && { pilots }),
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching exercises:', error)
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}
