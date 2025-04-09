import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { compare } from 'bcrypt'
import { createToken } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password } = body

    // Находим профиль пользователя
    const userProfile = await prisma.userProfile.findUnique({
      where: { email },
      include: {
        pilot: true,
        instructor: true,
      },
    })

    if (!userProfile) {
      return NextResponse.json({ error: 'Неверный email или пароль' }, { status: 401 })
    }

    const isValidPassword = await compare(password, userProfile.password)
    if (!isValidPassword) {
      return NextResponse.json({ error: 'Неверный email или пароль' }, { status: 401 })
    }

    // Определяем, какая роль у пользователя, и подготавливаем данные для токена
    const roleId = userProfile.pilot
      ? userProfile.pilot.id
      : userProfile.instructor
        ? userProfile.instructor.id
        : null
    const roleType = userProfile.pilot
      ? 'PILOT'
      : userProfile.instructor
        ? 'INSTRUCTOR'
        : 'SUPER_ADMIN'

    const token = await createToken({
      id: userProfile.id,
      email: userProfile.email,
      role: userProfile.role,
      profileId: userProfile.id,
      roleId: roleId,
      roleType: roleType,
    })

    const response = NextResponse.json({
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

    // Устанавливаем куки с токеном
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
    })

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}
