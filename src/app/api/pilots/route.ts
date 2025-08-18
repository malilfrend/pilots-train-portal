import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { TPilot } from '@/types/pilots'

type Response = {
  pilots: Array<TPilot>
}

export async function GET() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Недействительный токен' }, { status: 401 })
    }

    const roleType = payload.roleType as string

    // Проверяем, что пользователь - инструктор
    if (roleType !== 'INSTRUCTOR') {
      return NextResponse.json(
        {
          error: 'Доступ запрещен. Только инструкторы могут получать список пилотов',
        },
        { status: 403 }
      )
    }

    // Получаем всех пилотов с их профилями
    const pilots = await prisma.pilot.findMany({
      include: {
        profile: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            position: true,
            company: true,
          },
        },
      },
      orderBy: {
        profile: {
          lastName: 'asc',
        },
      },
    })

    const response: Response = {
      pilots: pilots.map((pilot) => ({
        id: pilot.id,
        profileId: pilot.profileId,
        profile: {
          id: pilot.profile.id,
          firstName: pilot.profile.firstName,
          lastName: pilot.profile.lastName,
          position: pilot.profile.position || undefined,
        },
      })),
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching pilots:', error)
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}
