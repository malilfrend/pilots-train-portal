'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function NotFound() {
  const router = useRouter()

  useEffect(() => {
    // Пытаемся вернуться назад
    if (window.history.length > 1) {
      router.back()
    } else {
      // Если истории нет, редиректим на главную
      router.push('/')
    }
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-gray-600 mb-4">Страница не найдена</p>
        <p className="text-gray-500">Выполняется перенаправление...</p>
      </div>
    </div>
  )
}
