import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { TExercise } from '@/types/exercises'
import { CompetencyCode } from '@prisma/client'
import { ALL_CODES } from '@/lib/exerciseSelection'

export async function GET() {
  try {
    const exercisesFromDB = await prisma.exercise.findMany({
      include: { competencies: true },
      orderBy: { id: 'asc' },
    })

    const exercises: TExercise[] = exercisesFromDB.map((exercise) => ({
      id: exercise.id,
      name: exercise.name,
      executionTime: exercise.executionTime,
      competencies: exercise.competencies.map(
        (competency) => competency.competencyCode as CompetencyCode
      ),
    }))

    return NextResponse.json({ exercises })
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
