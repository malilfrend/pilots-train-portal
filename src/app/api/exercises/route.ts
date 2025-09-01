import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { TExercise } from '@/types/exercises'
import { AssessmentSourceType, CompetencyCode } from '@prisma/client'
import { ASSESSMENT_TYPES } from '@/types/assessment'
import { loadWeights } from '@/db-utils/load-weights'
import { optimizeBalancedCountsPowell } from '@/lib/optimization'

type TPilotId = number

export type TDevelopment = Record<CompetencyCode, number>
export type TDevelopments = Record<TPilotId, TDevelopment>
type TResponse = { exercises: Array<TExercise>; developments?: TDevelopments }

const ALL_CODES: CompetencyCode[] = ['PRO', 'COM', 'FPA', 'FPM', 'LTW', 'PSD', 'SAW', 'WLM']

const DEFAULT_WEIGHTS: Record<AssessmentSourceType, number> = {
  PC: 0.35,
  FDM: 0.15,
  EVAL: 0.3,
  ASR: 0.2,
}

async function getPilotAverages(
  pilotId: number,
  weights: Record<CompetencyCode, Record<AssessmentSourceType, number>>
): Promise<Record<CompetencyCode, number | null>> {
  const rows = await prisma.pilotCompetencyScore.findMany({
    where: { pilotId },
    select: { competencyCode: true, sourceType: true, score: true },
  })

  const byCode = {} as Record<CompetencyCode, Partial<Record<AssessmentSourceType, number>>>
  for (const r of rows) {
    if (!byCode[r.competencyCode]) {
      byCode[r.competencyCode] = {}
    }
    byCode[r.competencyCode][r.sourceType] = r.score
  }

  const avg: Record<CompetencyCode, number | null> = {} as Record<CompetencyCode, number | null>
  for (const code of ALL_CODES) {
    const w = weights[code] || DEFAULT_WEIGHTS
    let sum = 0
    let sumW = 0

    ASSESSMENT_TYPES.forEach((type) => {
      const val = byCode[code]?.[type]
      const ww = w[type] ?? DEFAULT_WEIGHTS[type]
      if (typeof val === 'number') {
        sum += val * ww
        sumW += ww
      }
    })
    avg[code] = sumW > 0 ? Math.round((sum / sumW) * 10) / 10 : null
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

function applyExerciseAndTrack(
  competencyCodes: CompetencyCode[],
  deficits: Map<TPairKey, number>,
  d: number,
  pilots: number[],
  track: TDevelopments,
  currentScores: Map<TPairKey, number>
) {
  // 1) Фиксируем прирост по всем компетенциям упражнения для каждого пилота
  for (let pilotIndex = 0; pilotIndex < pilots.length; pilotIndex++) {
    const pilotId = pilots[pilotIndex]
    if (pilotId == null) continue
    track[pilotId] ||= {} as TDevelopment

    for (const code of competencyCodes) {
      const key = getPairKey(pilotIndex, code)
      const currentDeficit = deficits.get(key) ?? 0
      const currentScore = currentScores.get(key) ?? 5
      // Базовый прирост: если есть дефицит — не больше его и d, иначе d (этап 2)
      const baseIncrement = currentDeficit > 0 ? Math.min(currentDeficit, d) : d
      // Потолок: не превышать 5 баллов
      const headroom = Math.max(0, 5 - currentScore)
      const increment = Math.min(baseIncrement, headroom)

      const prev = track[pilotId][code] ?? 0
      track[pilotId][code] = Math.round((prev + increment) * 10) / 10

      // 2) Обновляем дефицит только если он был положительным
      if (currentDeficit > 0) {
        deficits.set(key, Math.max(0, Math.round((currentDeficit - increment) * 1000) / 1000))
      }

      // 3) Обновляем текущую оценку с учётом потолка 5
      currentScores.set(key, Math.round((currentScore + increment) * 10) / 10)
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
        (bestExercise === null || exercise.id < bestExercise.id))
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
      return NextResponse.json({ exercises: allExercises } as TResponse)
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
    const developments: TDevelopments = {}

    // Текущие оценки для учёта потолка 5 баллов
    const currentScores = new Map<TPairKey, number>()
    for (let pilotIndex = 0; pilotIndex < pilots.length; pilotIndex++) {
      const pilotAverages = await getPilotAverages(pilots[pilotIndex], await loadWeights())
      for (const code of ALL_CODES) {
        const avg = pilotAverages[code]
        currentScores.set(getPairKey(pilotIndex, code), typeof avg === 'number' ? avg : 0)
      }
    }

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
        const filterUti = (ex: TExercise) =>
          !usedExerciseIds.has(ex.id) && ex.competencies.some((c) => LminSet.has(c))
        const Uti = allExercises.filter(filterUti).sort((a, b) => a.id - b.id)

        if (Uti.length > 0) {
          const { bestExercise, bestRank } = tryPickBestExercise(Uti, deficits, d, Lcodes)
          candidate = bestExercise
          best = bestRank
        } else {
          const { bestExercise, bestRank } = tryPickBestExercise(
            allExercises.filter((ex) => !usedExerciseIds.has(ex.id)).sort((a, b) => a.id - b.id),
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
      applyExerciseAndTrack(
        candidate.competencies,
        deficits,
        d,
        pilots,
        developments,
        currentScores
      )
    }

    // Этап 2: гармоничное развитие — распределим оставшиеся слоты оптимизацией
    const remaining = limit - selectedExercises.length
    if (remaining > 0) {
      const exercisesLeft = allExercises
        .filter((ex) => !usedExerciseIds.has(ex.id))
        .sort((a, b) => a.id - b.id)
      if (exercisesLeft.length > 0) {
        // Сформируем пары (pilotIndex, competency)
        const pairs: Array<{ pilotIndex: number; code: CompetencyCode }> = []
        for (let pilotIndex = 0; pilotIndex < pilots.length; pilotIndex++) {
          for (const code of ALL_CODES) pairs.push({ pilotIndex, code })
        }

        const K = pairs.length
        const M = exercisesLeft.length

        const A: number[][] = Array.from({ length: K }, () => Array(M).fill(0))
        for (let k = 0; k < K; k++) {
          const code = pairs[k].code
          for (let j = 0; j < M; j++) {
            A[k][j] = exercisesLeft[j].competencies.includes(code) ? 1 : 0
          }
        }

        const s0: number[] = pairs.map(({ pilotIndex, code }) => {
          const v = currentScores.get(getPairKey(pilotIndex, code))
          return typeof v === 'number' ? v : 0
        })

        const { counts } = optimizeBalancedCountsPowell({
          A,
          s0,
          d,
          L: remaining,
          gamma: 10,
          lambda: 2000,
        })

        // Преобразуем counts в фактический список упражнений и обновим трекинг
        for (let j = 0; j < M; j++) {
          const ex = exercisesLeft[j]
          const c = counts[j] ?? 0
          for (let t = 0; t < c; t++) {
            if (selectedExercises.length >= limit) {
              break
            }
            selectedExercises.push(ex)
            usedExerciseIds.add(ex.id)
            applyExerciseAndTrack(ex.competencies, deficits, d, pilots, developments, currentScores)
          }
          if (selectedExercises.length >= limit) {
            break
          }
        }
      }
    }

    return NextResponse.json({ exercises: selectedExercises, developments } as TResponse)
  } catch (error) {
    console.error('Error fetching exercises:', error)
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}
