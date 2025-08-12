import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { TExercise } from '@/types/exercises'
import { CompetencyCode } from '@prisma/client'

type Response = {
  exercises: Array<TExercise>
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

    // Получаем все упражнения с их компетенциями
    const exercises = await prisma.exercise.findMany({
      include: {
        competencies: true,
      },
      orderBy: {
        name: 'asc',
      },
    })

    // Форматируем упражнения
    const formattedExercises = exercises.map((exercise) => ({
      id: exercise.id,
      name: exercise.name,
      competencies: exercise.competencies.map((comp) => comp.competencyCode as CompetencyCode),
    }))

    const response: Response = {
      exercises: formattedExercises,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching exercises:', error)
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}
