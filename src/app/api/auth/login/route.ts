import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { compare } from 'bcrypt'
import { createToken } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password } = body

    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      return NextResponse.json({ error: 'Неверный email или пароль' }, { status: 401 })
    }

    const isValidPassword = await compare(password, user.password)
    if (!isValidPassword) {
      return NextResponse.json({ error: 'Неверный email или пароль' }, { status: 401 })
    }

    const token = await createToken({
      id: user.id,
      email: user.email,
      role: user.role,
    })

    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
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
