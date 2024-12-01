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
    const existingUser = await prisma.user.findUnique({
      where: { email: validated.email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Пользователь с таким email уже существует' },
        { status: 400 }
      )
    }

    // Хешируем пароль
    const hashedPassword = await hash(validated.password, 10)

    // Создаем пользователя
    const user = await prisma.user.create({
      data: {
        ...validated,
        password: hashedPassword,
        birthDate: new Date(validated.birthDate),
      },
    })

    // Создаем токен
    const token = await createToken({
      id: user.id,
      email: user.email,
      role: user.role,
    })

    // Создаем ответ с токеном в куках
    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        university: user.university,
        company: user.company,
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
