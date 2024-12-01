import { NextResponse, type NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth'

// Редактирование комментария
export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Необходима авторизация' }, { status: 401 })
    }

    const body = await request.json()
    const { content, commentId } = body

    console.log('commentID :', commentId)

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: { author: true },
    })

    if (!comment) {
      return NextResponse.json({ error: 'Комментарий не найден' }, { status: 404 })
    }

    // Проверяем права на редактирование
    if (comment.authorId !== session.id && session.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Нет прав на редактирование' }, { status: 403 })
    }

    const updatedComment = await prisma.comment.update({
      where: { id: commentId },
      data: { content },
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

    return NextResponse.json(updatedComment)
  } catch (error) {
    console.error('Comment update error:', error)
    return NextResponse.json({ error: 'Ошибка при обновлении комментария' }, { status: 500 })
  }
}

// Удаление комментария
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Необходима авторизация' }, { status: 401 })
    }

    const commentID = parseInt(request.nextUrl.searchParams.get('id') ?? '')

    const comment = await prisma.comment.findUnique({
      where: { id: commentID },
      include: { author: true },
    })

    if (!comment) {
      return NextResponse.json({ error: 'Комментарий не найден' }, { status: 404 })
    }

    // Проверяем права на удаление
    if (comment.authorId !== session.id && session.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Нет прав на удаление' }, { status: 403 })
    }

    await prisma.comment.delete({
      where: { id: commentID },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Comment deletion error:', error)
    return NextResponse.json({ error: 'Ошибка при удалении комментария' }, { status: 500 })
  }
}
