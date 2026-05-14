import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { getLatestPilotScores } from '@/lib/assessments'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const pilotId = Number(searchParams.get('pilotId') ?? 0)

    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Недействительный токен' }, { status: 401 })
    }

    const scores = await getLatestPilotScores(pilotId)

    return NextResponse.json({ scores })
  } catch (error) {
    console.error('Error fetching assessments:', error)
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}
