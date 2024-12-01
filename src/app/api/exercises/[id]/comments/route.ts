import { NextResponse, type NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth'

// Получить комментарии к упражнению
export async function GET(request: NextRequest) {
  try {
    const exerciseID = parseInt(request.nextUrl.searchParams.get('id') ?? '')

    const comments = await prisma.comment.findMany({
      where: {
        exerciseId: exerciseID,
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
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Необходима авторизация' }, { status: 401 })
    }

    const body = await request.json()
    const { content } = body

    const exerciseID = parseInt(request.nextUrl.searchParams.get('id') ?? '')

    const comment = await prisma.comment.create({
      data: {
        content,
        exerciseId: exerciseID,
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
