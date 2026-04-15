import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { TPilot } from '@/types/pilots'
import { hash } from 'bcrypt'

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
            flightHours: true,
            aircraftType: true,
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
          flightHours: pilot.profile.flightHours,
          aircraftType: pilot.profile.aircraftType,
        },
      })),
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching pilots:', error)
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}

export async function POST(request: Request) {
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
    if (roleType !== 'INSTRUCTOR') {
      return NextResponse.json(
        { error: 'Доступ запрещен. Только инструкторы могут создавать пилотов' },
        { status: 403 }
      )
    }

    const data = await request.json()
    const { email, password, firstName, lastName, birthDate, position, flightHours, aircraftType } =
      data

    if (!email || !password || !firstName || !lastName || !birthDate) {
      return NextResponse.json(
        { error: 'Необходимо заполнить обязательные поля: email, пароль, ФИО, дата рождения' },
        { status: 400 }
      )
    }

    const existingUser = await prisma.userProfile.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Пользователь с таким email уже существует' },
        { status: 400 }
      )
    }

    const hashedPassword = await hash(password, 10)

    const result = await prisma.$transaction(async (tx) => {
      const userProfile = await tx.userProfile.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
          birthDate: new Date(birthDate),
          role: 'PILOT',
          position: position || null,
          flightHours: flightHours ? parseInt(flightHours) : null,
          aircraftType: aircraftType || null,
        },
      })

      const pilot = await tx.pilot.create({
        data: { profileId: userProfile.id },
      })

      return { userProfile, pilot }
    })

    return NextResponse.json({
      pilot: {
        id: result.pilot.id,
        profileId: result.userProfile.id,
        profile: {
          id: result.userProfile.id,
          firstName: result.userProfile.firstName,
          lastName: result.userProfile.lastName,
          position: result.userProfile.position || undefined,
          flightHours: result.userProfile.flightHours,
          aircraftType: result.userProfile.aircraftType,
        },
      },
    })
  } catch (error) {
    console.error('Error creating pilot:', error)
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}
