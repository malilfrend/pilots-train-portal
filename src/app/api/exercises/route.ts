import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { CompetencyCode } from '@/types/assessment'

type Response = Array<{
  id: number
  name: string
  competencies: Array<CompetencyCode>
}>

export async function GET() {
  try {
    // Получаем все упражнения с их компетенциями
    const exercises = await prisma.exercise.findMany({
      include: {
        competencies: true,
      },
      orderBy: {
        name: 'asc',
      },
    })

    // Форматируем данные в соответствии с требуемым типом Response
    const formattedExercises: Response = exercises.map((exercise) => ({
      id: exercise.id,
      name: exercise.name,
      competencies: exercise.competencies.map((comp) => comp.competencyCode as CompetencyCode),
    }))

    return NextResponse.json(formattedExercises)
  } catch (error) {
    console.error('Error fetching exercises:', error)
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}
