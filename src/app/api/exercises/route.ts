import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { TExercise } from '@/types/exercises'
import { AssessmentSourceType, CompetencyCode } from '@prisma/client'

type Response = { exercises: Array<TExercise> }

const ALL_CODES: CompetencyCode[] = ['PRO', 'COM', 'FPA', 'FPM', 'LTW', 'PSD', 'SAW', 'WLM']

const DEFAULT_WEIGHTS: Record<AssessmentSourceType, number> = {
  PC: 0.35,
  FDM: 0.15,
  EVAL: 0.3,
  ASR: 0.2,
}

async function loadWeights(): Promise<
  Record<CompetencyCode, Record<AssessmentSourceType, number>>
> {
  const rows = await prisma.competencyWeight.findMany()
  const map: Record<CompetencyCode, Record<AssessmentSourceType, number>> = {} as any
  for (const c of ALL_CODES) map[c] = { ...DEFAULT_WEIGHTS }
  for (const r of rows) {
    if (!map[r.competencyCode]) map[r.competencyCode] = { ...DEFAULT_WEIGHTS }
    map[r.competencyCode][r.sourceType] = r.weight
  }
  return map
}

async function getPilotAverages(
  pilotId: number,
  weights: Record<CompetencyCode, Record<AssessmentSourceType, number>>
): Promise<Record<CompetencyCode, number | null>> {
  const rows = await prisma.pilotCompetencyScore.findMany({
    where: { pilotId },
    select: { competencyCode: true, sourceType: true, score: true },
  })

  const byCode: Record<CompetencyCode, Partial<Record<AssessmentSourceType, number>>> = {} as any
  for (const r of rows) {
    if (!byCode[r.competencyCode]) byCode[r.competencyCode] = {}
    byCode[r.competencyCode][r.sourceType] = r.score
  }

  const avg: Record<CompetencyCode, number | null> = {} as any
  for (const code of ALL_CODES) {
    const w = weights[code] || DEFAULT_WEIGHTS
    let sum = 0,
      sumW = 0
    ;(['PC', 'FDM', 'EVAL', 'ASR'] as AssessmentSourceType[]).forEach((st) => {
      const val = byCode[code]?.[st]
      const ww = w[st] ?? DEFAULT_WEIGHTS[st]
      if (typeof val === 'number') {
        sum += val * ww
        sumW += ww
      }
    })
    avg[code] = sumW > 0 ? Math.round((sum / sumW) * 100) / 100 : null
  }
  return avg
}

type TPairKey = string // `${pilotIndex}:${code}`

const getPairKey = (pilotId: number, competencyCode: CompetencyCode): TPairKey =>
  `${pilotId}:${competencyCode}`

/**
 * @param exerciseCompetencyCodes - массив компетенций, которые развивает упражнение
 * @param deficits - мапа с дефицитами
 * @param d - параметр d
 * @returns ожидаемый прирост
 */
function expectedGainForExercise(
  exerciseCompetencyCodes: CompetencyCode[],
  deficits: Map<TPairKey, number>,
  d: number
): number {
  let total = 0

  for (const [key, value] of deficits) {
    if (value <= 0) {
      continue
    }

    const code = key.split(':')[1] as CompetencyCode

    if (exerciseCompetencyCodes.includes(code)) {
      total += Math.min(value, d)
    }
  }

  return Math.round(total * 1000) / 1000
}

function applyExercise(
  competencyCodes: CompetencyCode[],
  deficits: Map<TPairKey, number>,
  d: number
) {
  for (const [key, value] of deficits) {
    if (value <= 0) {
      continue
    }

    const code = key.split(':')[1] as CompetencyCode

    if (competencyCodes.includes(code)) {
      deficits.set(key, Math.max(0, Math.round((value - d) * 1000) / 1000))
    }
  }
}

const rank = (
  exercise: TExercise,
  deficits: Map<TPairKey, number>,
  d: number,
  Lcodes: Set<CompetencyCode>
) => {
  const imp = expectedGainForExercise(exercise.competencies, deficits, d)

  return {
    imp,
    cover: exercise.competencies.reduce((acc, c) => acc + (Lcodes.has(c) ? 1 : 0), 0),
  }
}

const tryPickBestExercise = (
  exercisesPool: TExercise[],
  deficits: Map<TPairKey, number>,
  d: number,
  Lcodes: Set<CompetencyCode>
) => {
  let bestExercise: TExercise | null = null
  let bestRank = { imp: 0, cover: 0 }

  for (const exercise of exercisesPool) {
    const r = rank(exercise, deficits, d, Lcodes)

    if (
      r.imp > bestRank.imp ||
      (r.imp === bestRank.imp && r.cover > bestRank.cover) ||
      (r.imp === bestRank.imp &&
        r.cover === bestRank.cover &&
        (bestExercise === null || exercise.name.localeCompare(bestExercise.name, 'en') < 0))
    ) {
      bestExercise = exercise
      bestRank = r
    }
  }

  return { bestExercise, bestRank }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)

    const pilot1Id = searchParams.get('pilot1Id')
    const pilot2Id = searchParams.get('pilot2Id')

    const limit = Math.max(1, Number(searchParams.get('limit') ?? '24'))
    const R = Number(searchParams.get('R') ?? '3.5')
    const d = Number(searchParams.get('d') ?? '0.1')

    if (pilot1Id && isNaN(Number(pilot1Id))) {
      return NextResponse.json({ error: 'Неверный формат pilot1Id' }, { status: 400 })
    }
    if (pilot2Id && isNaN(Number(pilot2Id))) {
      return NextResponse.json({ error: 'Неверный формат pilot2Id' }, { status: 400 })
    }

    const exercisesFromDB = await prisma.exercise.findMany({
      include: { competencies: true },
      orderBy: { name: 'asc' },
    })

    const allExercises: TExercise[] = exercisesFromDB.map((exercise) => ({
      id: exercise.id,
      name: exercise.name,
      competencies: exercise.competencies.map(
        (competency) => competency.competencyCode as CompetencyCode
      ),
    }))

    // Нет пилотов — отдаём упражнения как есть
    if (!pilot1Id && !pilot2Id) {
      return NextResponse.json({ exercises: allExercises } as Response)
    }

    const weights = await loadWeights()

    // Считаем дефициты по парам (pilot, code)
    const deficits = new Map<TPairKey, number>()

    const pilots: Array<number> = []

    if (pilot1Id) {
      pilots.push(Number(pilot1Id))
    }
    if (pilot2Id) {
      pilots.push(Number(pilot2Id))
    }

    for (let pilotIndex = 0; pilotIndex < pilots.length; pilotIndex++) {
      // мапа = {[компетенция]: средний балл, ...}
      const pilotAverages = await getPilotAverages(pilots[pilotIndex], weights)

      for (const code of ALL_CODES) {
        const averageScore = pilotAverages[code]

        deficits.set(getPairKey(pilotIndex, code), Math.max(0, R - (averageScore ?? R)))
      }
    }

    // Итеративный отбор на limit слотов
    const selectedExercises: TExercise[] = []
    const usedExerciseIds = new Set<number>()

    while (selectedExercises.length < limit) {
      // L — пары с дефицитом > 0
      const L = [...deficits.entries()].filter(([, val]) => val > 0)

      if (L.length === 0) {
        break
      }

      // здесь используем Math.max, а не Math.min,
      // потому что нам нужно найти максимальный дефицит
      const Vmin = Math.max(...L.map(([, val]) => val))
      const Lmin = L.filter(([, val]) => val === Vmin).map(([k]) => k)
      const Lcodes = new Set(L.map(([k]) => k.split(':')[1] as CompetencyCode))
      const LminCodes = new Set(Lmin.map((k) => k.split(':')[1] as CompetencyCode))

      // Uimp: упражнения, содержащие любую из Lmin и одновременно хотя бы одну из L (другую или ту же)
      const Uimp = allExercises.filter(
        (exercise) =>
          !usedExerciseIds.has(exercise.id) &&
          exercise.competencies.some((c) => LminCodes.has(c)) &&
          exercise.competencies.some((c) => Lcodes.has(c))
      )

      let candidate: TExercise | null = null
      let best = { imp: 0, cover: 0 }

      if (Uimp.length > 0) {
        const { bestExercise, bestRank } = tryPickBestExercise(Uimp, deficits, d, Lcodes)
        candidate = bestExercise
        best = bestRank
      } else {
        // Uti для любой пары из Lmin
        const LminSet = new Set<CompetencyCode>([...LminCodes])
        const Uti = allExercises.filter(
          (ex) => !usedExerciseIds.has(ex.id) && ex.competencies.some((c) => LminSet.has(c))
        )

        if (Uti.length > 0) {
          const { bestExercise, bestRank } = tryPickBestExercise(Uti, deficits, d, Lcodes)
          candidate = bestExercise
          best = bestRank
        } else {
          const { bestExercise, bestRank } = tryPickBestExercise(
            allExercises.filter((ex) => !usedExerciseIds.has(ex.id)),
            deficits,
            d,
            Lcodes
          ) // запасной вариант
          candidate = bestExercise
          best = bestRank
        }
      }

      if (!candidate) {
        break
      }
      if (best.imp <= 0) {
        break
      }

      selectedExercises.push(candidate)
      usedExerciseIds.add(candidate.id)

      applyExercise(candidate.competencies, deficits, d)
    }

    // Добор до лимита (если остались места)
    if (selectedExercises.length < limit) {
      for (const ex of allExercises) {
        if (selectedExercises.length >= limit) {
          break
        }
        if (!usedExerciseIds.has(ex.id)) {
          selectedExercises.push(ex)
        }
      }
    }

    return NextResponse.json({ exercises: selectedExercises } as Response)
  } catch (error) {
    console.error('Error fetching exercises:', error)
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}
