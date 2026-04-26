import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { TExercise } from '@/types/exercises'
import { CompetencyCode } from '@prisma/client'

const ALL_CODES: CompetencyCode[] = ['PRO', 'COM', 'FPA', 'FPM', 'LTW', 'PSD', 'SAW', 'WLM']

const DEFAULT_EXECUTION_TIME = 30
const DEFAULT_TOTAL_TIME = 240

type TResponse = { exercises: Array<TExercise> }

async function getPilotScores(pilotId: number): Promise<Record<CompetencyCode, number | null>> {
  const rows = await prisma.pilotCompetencyScore.findMany({
    where: { pilotId },
    select: { competencyCode: true, score: true },
  })

  const scores: Record<CompetencyCode, number | null> = {} as Record<CompetencyCode, number | null>
  for (const code of ALL_CODES) {
    const found = rows.find((r) => r.competencyCode === code)
    scores[code] = found ? found.score : null
  }
  return scores
}

type PilotKey = 1 | 2
type DeficitLevel = 2 | 3 | 4
type DeficitsByLevel = Record<DeficitLevel, CompetencyCode[]>

const DEFICIT_LEVELS: DeficitLevel[] = [2, 3, 4]

function buildPilotDeficits(scores: Record<CompetencyCode, number | null>): DeficitsByLevel {
  const deficits: DeficitsByLevel = { 2: [], 3: [], 4: [] }
  for (const code of ALL_CODES) {
    const raw = scores[code] ?? 2
    const s = Math.floor(raw)
    if (s <= 2) deficits[2].push(code)
    else if (s === 3) deficits[3].push(code)
    else if (s === 4) deficits[4].push(code)
  }
  return deficits
}

function buildPilotTopCompetencies(
  scores: Record<CompetencyCode, number | null>
): CompetencyCode[] {
  return ALL_CODES.filter((c) => scores[c] === 5)
}

function pickBest(
  exercises: TExercise[],
  isCandidate: (ex: TExercise) => boolean,
  coverageOf: (ex: TExercise) => number
): TExercise | null {
  let best: TExercise | null = null
  let bestCov = 0
  let bestTime = Infinity
  let bestId = Infinity

  for (const ex of exercises) {
    if (!isCandidate(ex)) continue
    const cov = coverageOf(ex)
    if (cov === 0) continue
    const t = ex.executionTime ?? DEFAULT_EXECUTION_TIME

    if (
      cov > bestCov ||
      (cov === bestCov && t < bestTime) ||
      (cov === bestCov && t === bestTime && ex.id < bestId)
    ) {
      best = ex
      bestCov = cov
      bestTime = t
      bestId = ex.id
    }
  }
  return best
}

type Stage1Result = {
  selected: TExercise[]
  usedIds: Set<number>
  usedTime: number
  covered: Record<PilotKey, Set<CompetencyCode>>
}

/**
 * Этап 1: для каждого пилота отдельно — последовательно закрываем дефициты
 * по уровням q ∈ {2,3,4}. Внутри уровня первым идёт пилот с большим |W_p^q|
 * (при равенстве — p=1), пилоты чередуются. При нарушении временного лимита
 * последний кандидат не добавляется и Этап 1 завершается досрочно.
 */
function stage1(
  exercises: TExercise[],
  deficits: Record<PilotKey, DeficitsByLevel>,
  totalTime: number
): Stage1Result {
  const selected: TExercise[] = []
  const usedIds = new Set<number>()
  const covered: Record<PilotKey, Set<CompetencyCode>> = {
    1: new Set(),
    2: new Set(),
  }
  // Изменяемые копии — будем удалять покрытое.
  const W: Record<PilotKey, DeficitsByLevel> = {
    1: { 2: [...deficits[1][2]], 3: [...deficits[1][3]], 4: [...deficits[1][4]] },
    2: { 2: [...deficits[2][2]], 3: [...deficits[2][3]], 4: [...deficits[2][4]] },
  }
  let usedTime = 0
  let timeExceeded = false

  for (const q of DEFICIT_LEVELS) {
    if (timeExceeded) break

    const order: PilotKey[] = W[1][q].length >= W[2][q].length ? [1, 2] : [2, 1]

    while (true) {
      let progressed = false

      for (const p of order) {
        if (timeExceeded) break
        const wq = W[p][q]
        if (wq.length === 0) continue

        const wqSet = new Set(wq)
        const best = pickBest(
          exercises,
          (ex) => !usedIds.has(ex.id) && ex.competencies.some((c) => wqSet.has(c)),
          (ex) => ex.competencies.filter((c) => wqSet.has(c)).length
        )

        if (!best) {
          // Нет кандидатов для этого уровня у текущего пилота — не пытаемся снова.
          W[p][q] = []
          continue
        }

        const t = best.executionTime ?? DEFAULT_EXECUTION_TIME
        if (usedTime + t > totalTime) {
          timeExceeded = true
          break
        }

        selected.push({ ...best, step: 'first', pilot: p, role: p === 1 ? 'PF' : 'PM' })
        usedIds.add(best.id)
        usedTime += t
        for (const c of best.competencies) covered[p].add(c)
        W[p][q] = wq.filter((c) => !best.competencies.includes(c))
        progressed = true
      }

      if (!progressed) break
    }
  }

  return { selected, usedIds, usedTime, covered }
}

/**
 * Этап 2: подбор упражнений для компетенций с оценкой 5 (F_p).
 * Выполняется только при T_rem > 0 и наличии F_p хотя бы у одного пилота.
 * Первым обслуживается пилот с большим |F_p| (тай-брейк p=1); если у одного
 * пилота F_p = ∅ — он не обслуживается. После выбора упражнения p* меняется.
 * Критерий: max покрытия F_p*, затем min t_k, затем min id.
 */
function stage2(
  exercises: TExercise[],
  state: Stage1Result,
  topByPilot: Record<PilotKey, CompetencyCode[]>,
  totalTime: number
): TExercise[] {
  const F: Record<PilotKey, CompetencyCode[]> = {
    1: [...topByPilot[1]],
    2: [...topByPilot[2]],
  }

  let tRem = totalTime - state.usedTime
  if (tRem <= 0) return []
  if (F[1].length === 0 && F[2].length === 0) return []

  let pStar: PilotKey
  if (F[1].length > 0 && F[2].length === 0) pStar = 1
  else if (F[2].length > 0 && F[1].length === 0) pStar = 2
  else pStar = F[1].length >= F[2].length ? 1 : 2

  const result: TExercise[] = []

  while (tRem > 0 && (F[1].length > 0 || F[2].length > 0)) {
    if (F[pStar].length === 0) {
      const other: PilotKey = pStar === 1 ? 2 : 1
      if (F[other].length === 0) break
      pStar = other
      continue
    }

    const fSet = new Set(F[pStar])
    const best = pickBest(
      exercises,
      (ex) => !state.usedIds.has(ex.id) && ex.competencies.some((c) => fSet.has(c)),
      (ex) => ex.competencies.filter((c) => fSet.has(c)).length
    )

    if (!best) {
      F[pStar] = []
      pStar = pStar === 1 ? 2 : 1
      continue
    }

    const t = best.executionTime ?? DEFAULT_EXECUTION_TIME
    if (tRem - t < 0) break

    result.push({ ...best, step: 'second', pilot: pStar, role: pStar === 1 ? 'PF' : 'PM' })
    state.usedIds.add(best.id)
    state.usedTime += t
    tRem -= t
    for (const c of best.competencies) state.covered[pStar].add(c)
    F[pStar] = F[pStar].filter((c) => !best.competencies.includes(c))
    pStar = pStar === 1 ? 2 : 1
  }

  return result
}

function emptyScores(): Record<CompetencyCode, number | null> {
  const s: Record<CompetencyCode, number | null> = {} as Record<CompetencyCode, number | null>
  for (const c of ALL_CODES) s[c] = null
  return s
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)

    const pilot1Id = searchParams.get('pilot1Id')
    const pilot2Id = searchParams.get('pilot2Id')
    const T = Math.max(1, Number(searchParams.get('T') ?? DEFAULT_TOTAL_TIME))

    if (pilot1Id && isNaN(Number(pilot1Id))) {
      return NextResponse.json({ error: 'Неверный формат pilot1Id' }, { status: 400 })
    }
    if (pilot2Id && isNaN(Number(pilot2Id))) {
      return NextResponse.json({ error: 'Неверный формат pilot2Id' }, { status: 400 })
    }

    const exercisesFromDB = await prisma.exercise.findMany({
      include: { competencies: true },
      orderBy: { id: 'asc' },
    })

    const allExercises: TExercise[] = exercisesFromDB.map((exercise) => ({
      id: exercise.id,
      name: exercise.name,
      executionTime: exercise.executionTime,
      competencies: exercise.competencies.map(
        (competency) => competency.competencyCode as CompetencyCode
      ),
    }))

    if (!pilot1Id && !pilot2Id) {
      return NextResponse.json({ exercises: allExercises } as TResponse)
    }

    const scores1 = pilot1Id ? await getPilotScores(Number(pilot1Id)) : emptyScores()
    const scores2 = pilot2Id ? await getPilotScores(Number(pilot2Id)) : emptyScores()

    const deficits: Record<PilotKey, DeficitsByLevel> = {
      1: buildPilotDeficits(scores1),
      2: buildPilotDeficits(scores2),
    }
    const top: Record<PilotKey, CompetencyCode[]> = {
      1: buildPilotTopCompetencies(scores1),
      2: buildPilotTopCompetencies(scores2),
    }

    const stage1Result = stage1(allExercises, deficits, T)
    const stage2Exercises = stage2(allExercises, stage1Result, top, T)

    const exercises = [...stage1Result.selected, ...stage2Exercises]

    return NextResponse.json({ exercises } as TResponse)
  } catch (error) {
    console.error('Error fetching exercises:', error)
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}

function validateCompetencies(value: unknown): value is CompetencyCode[] {
  return Array.isArray(value) && value.every((c) => ALL_CODES.includes(c as CompetencyCode))
}

// Обновление упражнения (name, executionTime, competencies)
export async function PATCH(request: Request) {
  try {
    const data = await request.json()
    const { id, name, executionTime, competencies } = data

    if (!id || typeof id !== 'number') {
      return NextResponse.json({ error: 'Неверный формат id' }, { status: 400 })
    }

    if (name !== undefined && (typeof name !== 'string' || name.trim() === '')) {
      return NextResponse.json({ error: 'Неверный формат name' }, { status: 400 })
    }

    if (
      executionTime !== undefined &&
      executionTime !== null &&
      (typeof executionTime !== 'number' || executionTime < 0)
    ) {
      return NextResponse.json({ error: 'Неверный формат executionTime' }, { status: 400 })
    }

    if (competencies !== undefined && !validateCompetencies(competencies)) {
      return NextResponse.json({ error: 'Неверный формат competencies' }, { status: 400 })
    }

    const updateData: { name?: string; executionTime?: number | null } = {}
    if (name !== undefined) updateData.name = name.trim()
    if (executionTime !== undefined) updateData.executionTime = executionTime

    const exercise = await prisma.$transaction(async (tx) => {
      if (Object.keys(updateData).length > 0) {
        await tx.exercise.update({ where: { id }, data: updateData })
      }
      if (competencies !== undefined) {
        await tx.exerciseCompetency.deleteMany({ where: { exerciseId: id } })
        if (competencies.length > 0) {
          await tx.exerciseCompetency.createMany({
            data: competencies.map((competencyCode: CompetencyCode) => ({
              exerciseId: id,
              competencyCode,
            })),
          })
        }
      }
      return tx.exercise.findUniqueOrThrow({
        where: { id },
        include: { competencies: true },
      })
    })

    return NextResponse.json({
      id: exercise.id,
      name: exercise.name,
      executionTime: exercise.executionTime,
      competencies: exercise.competencies.map((c) => c.competencyCode),
    })
  } catch (error) {
    console.error('Error updating exercise:', error)
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}

// Создание упражнения
export async function POST(request: Request) {
  try {
    const data = await request.json()
    const { name, executionTime, competencies } = data

    if (typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json({ error: 'Неверный формат name' }, { status: 400 })
    }

    if (
      executionTime !== undefined &&
      executionTime !== null &&
      (typeof executionTime !== 'number' || executionTime < 0)
    ) {
      return NextResponse.json({ error: 'Неверный формат executionTime' }, { status: 400 })
    }

    if (!validateCompetencies(competencies ?? [])) {
      return NextResponse.json({ error: 'Неверный формат competencies' }, { status: 400 })
    }

    const codes: CompetencyCode[] = competencies ?? []

    const exercise = await prisma.exercise.create({
      data: {
        name: name.trim(),
        executionTime: executionTime ?? null,
        competencies: {
          create: codes.map((competencyCode) => ({ competencyCode })),
        },
      },
      include: { competencies: true },
    })

    return NextResponse.json({
      id: exercise.id,
      name: exercise.name,
      executionTime: exercise.executionTime,
      competencies: exercise.competencies.map((c) => c.competencyCode),
    })
  } catch (error) {
    console.error('Error creating exercise:', error)
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}

// Удаление упражнения
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const idParam = searchParams.get('id')
    const id = Number(idParam)

    if (!idParam || isNaN(id)) {
      return NextResponse.json({ error: 'Неверный формат id' }, { status: 400 })
    }

    await prisma.$transaction([
      prisma.exerciseCompetency.deleteMany({ where: { exerciseId: id } }),
      prisma.exercise.delete({ where: { id } }),
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting exercise:', error)
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}
