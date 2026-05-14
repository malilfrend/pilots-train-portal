import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { TExercise } from '@/types/exercises'
import { CompetencyCode } from '@prisma/client'
import { ALL_CODES, DEFAULT_TOTAL_TIME, Scores, generateScenario } from '@/lib/exerciseSelection'

function normalizeScores(input: unknown): Scores | null {
  if (!input || typeof input !== 'object') return null
  const out = {} as Scores
  const src = input as Record<string, unknown>
  for (const code of ALL_CODES) {
    const v = src[code]
    if (v === null || v === undefined) {
      out[code] = null
    } else if (typeof v === 'number' && v >= 2 && v <= 5) {
      out[code] = v
    } else {
      return null
    }
  }
  return out
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const { pilot1Scores: raw1, pilot2Scores: raw2 } = data
    const T = Math.max(1, Math.floor(Number(data.T ?? DEFAULT_TOTAL_TIME)))

    const pilot1Scores = normalizeScores(raw1)
    const pilot2Scores = normalizeScores(raw2)

    if (!pilot1Scores && !pilot2Scores) {
      return NextResponse.json(
        { error: 'Нужно передать оценки хотя бы одного пилота' },
        { status: 400 }
      )
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

    const { exercises, totalValue } = generateScenario(allExercises, pilot1Scores, pilot2Scores, T)

    return NextResponse.json({ exercises, totalValue })
  } catch (error) {
    console.error('Error generating exercises:', error)
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}
