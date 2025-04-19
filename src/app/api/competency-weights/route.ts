import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { getCompetencyWeights, updateCompetencyWeights } from '@/lib/competencyWeights'

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

    // Получаем веса компетенций
    const weights = await getCompetencyWeights()

    return NextResponse.json({ weights })
  } catch (error) {
    console.error('Error fetching competency weights:', error)
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
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

    const body = await request.json()
    const { weights } = body
    if (!weights) {
      return NextResponse.json({ error: 'Не переданы веса' }, { status: 400 })
    }

    // Обновляем веса компетенций
    await updateCompetencyWeights(weights)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating competency weights:', error)
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}
