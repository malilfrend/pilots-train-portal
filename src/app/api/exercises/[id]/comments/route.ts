import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth'

// Получить комментарии к упражнению
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const comments = await prisma.comment.findMany({
      where: {
        exerciseId: parseInt(params.id),
      },
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
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(comments)
  } catch (error) {
    console.error('Comments fetch error:', error)
    return NextResponse.json({ error: 'Ошибка при получении комментариев' }, { status: 500 })
  }
}

// Добавить комментарий
export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Необходима авторизация' }, { status: 401 })
    }

    const body = await request.json()
    const { content } = body

    const comment = await prisma.comment.create({
      data: {
        content,
        exerciseId: parseInt(params.id),
        authorId: session.id as number,
      },
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
    })

    return NextResponse.json(comment)
  } catch (error) {
    console.error('Comment creation error:', error)
    return NextResponse.json({ error: 'Ошибка при создании комментария' }, { status: 500 })
  }
}
