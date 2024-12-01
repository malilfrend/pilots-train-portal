import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// Получить все сессии
export async function GET() {
  try {
    const sessions = await prisma.session.findMany({
      include: {
        exercises: {
          include: {
            _count: {
              select: { comments: true },
            },
          },
        },
      },
    })

    return NextResponse.json(sessions)
  } catch (error) {
    console.error('Sessions fetch error:', error)
    return NextResponse.json({ error: 'Ошибка при получении сессий' }, { status: 500 })
  }
}
