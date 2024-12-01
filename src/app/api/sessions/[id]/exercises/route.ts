import { NextResponse, type NextRequest } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = await params
    const sessionID = parseInt(id)

    const exercises = await prisma.exercise.findMany({
      where: {
        sessionId: sessionID,
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
