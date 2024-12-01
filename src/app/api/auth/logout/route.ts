import { NextResponse } from 'next/server'

export async function POST() {
  const response = NextResponse.json({ success: true })

  // Удаляем куки с токеном
  response.cookies.delete('token')

  return response
}
