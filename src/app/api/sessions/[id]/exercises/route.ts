import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params
    const { id } = params

    const exercises = await prisma.exercise.findMany({
      where: {
        sessionId: parseInt(id),
      },
      include: {
        comments: {
          include: {
            author: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                role: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json(exercises)
  } catch (error) {
    console.error('Exercises fetch error:', error)
    return NextResponse.json({ error: 'Ошибка при получении упражнений' }, { status: 500 })
  }
}
