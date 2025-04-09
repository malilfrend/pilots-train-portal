import { NextResponse } from 'next/server'
import { hash } from 'bcrypt'
import prisma from '@/lib/prisma'
import { registerSchema } from '@/lib/validations/auth'
import { createToken } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validated = registerSchema.parse(body)

    // Проверяем, существует ли пользователь
    const existingUserProfile = await prisma.userProfile.findUnique({
      where: { email: validated.email },
    })

    if (existingUserProfile) {
      return NextResponse.json(
        { error: 'Пользователь с таким email уже существует' },
        { status: 400 }
      )
    }

    // Хешируем пароль
    const hashedPassword = await hash(validated.password, 10)

    // Создаем профиль пользователя и соответствующую роль в одной транзакции
    const result = await prisma.$transaction(async (tx) => {
      // 1. Создаем базовый профиль пользователя
      const userProfile = await tx.userProfile.create({
        data: {
          email: validated.email,
          password: hashedPassword,
          firstName: validated.firstName,
          lastName: validated.lastName,
          birthDate: new Date(validated.birthDate),
          university: validated.university,
          company: validated.company,
          role: validated.role,
          experience: validated.experience,
          position: validated.position,
        },
      })

      // 2. В зависимости от роли создаем либо пилота, либо инструктора
      if (validated.role === 'PILOT') {
        const pilot = await tx.pilot.create({
          data: {
            profileId: userProfile.id,
          },
        })
        return { userProfile, roleId: pilot.id, type: 'PILOT' }
      } else {
        const instructor = await tx.instructor.create({
          data: {
            profileId: userProfile.id,
          },
        })
        return { userProfile, roleId: instructor.id, type: 'INSTRUCTOR' }
      }
    })

    // Создаем токен с данными пользователя
    const { userProfile, roleId, type } = result
    const token = await createToken({
      id: userProfile.id,
      email: userProfile.email,
      role: userProfile.role,
      profileId: userProfile.id,
      roleId: roleId,
      roleType: type,
    })

    // Создаем ответ с токеном в куках
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
        pilotId: type === 'PILOT' ? roleId : undefined,
        instructorId: type === 'INSTRUCTOR' ? roleId : undefined,
      },
    })

    // Устанавливаем куки
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json({ error: 'Ошибка при регистрации' }, { status: 500 })
  }
}
