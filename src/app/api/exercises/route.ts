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

/**
 * Строит приоритетные уровни L1-L4 по порогам оценок.
 * Для каждой компетенции берётся минимальная оценка по всем пилотам (null → 2).
 * L1: score <= 2, L2: 2 < score <= 3, L3: 3 < score <= 4, L4: score > 4.
 */
function buildPriorityLevels(
  pilotScoresMap: Map<number, Record<CompetencyCode, number | null>>
): CompetencyCode[][] {
  const levels: CompetencyCode[][] = [[], [], [], []]

  for (const code of ALL_CODES) {
    let minScore = Infinity
    for (const scores of pilotScoresMap.values()) {
      const s = scores[code] ?? 2
      if (s < minScore) minScore = s
    }
    const score = minScore === Infinity ? 2 : minScore

    let levelIndex: number
    if (score <= 2) levelIndex = 0
    else if (score <= 3) levelIndex = 1
    else if (score <= 4) levelIndex = 2
    else levelIndex = 3

    levels[levelIndex].push(code)
  }

  return levels
}

/**
 * Этап 1: приоритетный выбор упражнений для дефицитных компетенций.
 * Обрабатывает уровни L1→L4 последовательно.
 * Критерий F1: количество покрываемых active-компетенций.
 * Tie-break: меньше executionTime, затем меньше id.
 */
function stage1CoverageGreedy(
  exercises: TExercise[],
  levels: CompetencyCode[][],
  totalTime: number
): { selected: TExercise[]; covered: Set<CompetencyCode>; usedTime: number } {
  const selected: TExercise[] = []
  const covered = new Set<CompetencyCode>()
  const usedIds = new Set<number>()
  let usedTime = 0

  for (const level of levels) {
    let active = level.filter((c) => !covered.has(c))
    if (active.length === 0) continue

    while (active.length > 0) {
      let bestExercise: TExercise | null = null
      let bestF1 = 0
      let bestTime = Infinity
      let bestId = Infinity

      for (const ex of exercises) {
        if (usedIds.has(ex.id)) continue

        const exTime = ex.executionTime ?? DEFAULT_EXECUTION_TIME
        const f1 = ex.competencies.filter((c) => active.includes(c)).length
        if (f1 === 0) continue

        if (
          f1 > bestF1 ||
          (f1 === bestF1 && exTime < bestTime) ||
          (f1 === bestF1 && exTime === bestTime && ex.id < bestId)
        ) {
          bestExercise = ex
          bestF1 = f1
          bestTime = exTime
          bestId = ex.id
        }
      }

      if (!bestExercise) break

      const candidateTime = bestExercise.executionTime ?? DEFAULT_EXECUTION_TIME
      if (usedTime + candidateTime > totalTime) {
        return { selected, covered, usedTime }
      }

      selected.push({ ...bestExercise, step: 'first' })
      usedIds.add(bestExercise.id)
      usedTime += candidateTime

      for (const c of bestExercise.competencies) {
        covered.add(c)
      }

      active = level.filter((c) => !covered.has(c))
    }
  }

  return { selected, covered, usedTime }
}

/**
 * Этап 2: рациональное использование оставшегося времени.
 * Приоритет — непокрытым компетенциям.
 * Критерий F2: (кол-во непокрытых компетенций) / executionTime.
 * Если все покрыты: F2 = (общее кол-во компетенций) / executionTime.
 * Tie-break: меньше executionTime, затем меньше id.
 */
function stage2EfficiencyGreedy(
  exercises: TExercise[],
  usedIdsFromStage1: Set<number>,
  covered: Set<CompetencyCode>,
  usedTime: number,
  totalTime: number
): TExercise[] {
  const selected: TExercise[] = []
  const usedIds = new Set(usedIdsFromStage1)
  const coveredSet = new Set(covered)

  while (true) {
    const remainingTime = totalTime - usedTime

    const available = exercises.filter((ex) => {
      if (usedIds.has(ex.id)) return false
      const exTime = ex.executionTime ?? DEFAULT_EXECUTION_TIME
      return exTime <= remainingTime
    })

    if (available.length === 0) break

    const uncoveredExist = ALL_CODES.some((c) => !coveredSet.has(c))

    let candidates: TExercise[]
    if (uncoveredExist) {
      candidates = available.filter((ex) => ex.competencies.some((c) => !coveredSet.has(c)))
      if (candidates.length === 0) {
        candidates = available
      }
    } else {
      candidates = available
    }

    let bestExercise: TExercise | null = null
    let bestF2 = -1
    let bestTime = Infinity
    let bestId = Infinity

    for (const ex of candidates) {
      const exTime = ex.executionTime ?? DEFAULT_EXECUTION_TIME

      let coverageCount: number
      if (uncoveredExist && ex.competencies.some((c) => !coveredSet.has(c))) {
        coverageCount = ex.competencies.filter((c) => !coveredSet.has(c)).length
      } else {
        coverageCount = ex.competencies.length
      }

      const f2 = coverageCount / exTime

      if (
        f2 > bestF2 ||
        (f2 === bestF2 && exTime < bestTime) ||
        (f2 === bestF2 && exTime === bestTime && ex.id < bestId)
      ) {
        bestExercise = ex
        bestF2 = f2
        bestTime = exTime
        bestId = ex.id
      }
    }

    if (!bestExercise) break

    const candidateTime = bestExercise.executionTime ?? DEFAULT_EXECUTION_TIME
    selected.push({ ...bestExercise, step: 'second' })
    usedIds.add(bestExercise.id)
    usedTime += candidateTime

    for (const c of bestExercise.competencies) {
      coveredSet.add(c)
    }
  }

  return selected
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

    const pilots: number[] = []
    if (pilot1Id) pilots.push(Number(pilot1Id))
    if (pilot2Id) pilots.push(Number(pilot2Id))

    const pilotScoresMap = new Map<number, Record<CompetencyCode, number | null>>()
    for (const pid of pilots) {
      pilotScoresMap.set(pid, await getPilotScores(pid))
    }

    const levels = buildPriorityLevels(pilotScoresMap)

    const {
      selected: stage1Exercises,
      covered,
      usedTime,
    } = stage1CoverageGreedy(allExercises, levels, T)

    const usedIdsFromStage1 = new Set(stage1Exercises.map((ex) => ex.id))

    const stage2Exercises = stage2EfficiencyGreedy(
      allExercises,
      usedIdsFromStage1,
      covered,
      usedTime,
      T
    )

    const exercises = [...stage1Exercises, ...stage2Exercises]

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
