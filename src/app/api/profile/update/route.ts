import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { updateProfileSchema } from '@/lib/validations/auth'

export async function PUT(request: Request) {
  try {
    // Получаем и проверяем токен
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Недействительный токен' }, { status: 401 })
    }

    // Получаем данные из запроса
    const body = await request.json()

    // Валидируем данные
    const validated = updateProfileSchema.parse(body)

    // Обновляем профиль пользователя
    await prisma.userProfile.update({
      where: { id: payload.id as number },
      data: {
        firstName: validated.firstName,
        lastName: validated.lastName,
        university: validated.university,
        company: validated.company,
        experience: validated.experience,
        position: validated.position,
      },
    })

    // Получаем обновленные данные пользователя
    const userProfile = await prisma.userProfile.findUnique({
      where: { id: payload.id as number },
      include: {
        pilot: true,
        instructor: true,
      },
    })

    if (!userProfile) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 })
    }

    // Возвращаем обновленные данные пользователя
    return NextResponse.json({
      user: {
        id: userProfile.id,
        email: userProfile.email,
        firstName: userProfile.firstName,
        lastName: userProfile.lastName,
        role: userProfile.role,
        university: userProfile.university,
        company: userProfile.company,
        experience: userProfile.experience,
        position: userProfile.position,
        profileId: userProfile.id,
        pilotId: userProfile.pilot?.id,
        instructorId: userProfile.instructor?.id,
      },
    })
  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json({ error: 'Ошибка при обновлении профиля' }, { status: 500 })
  }
}
