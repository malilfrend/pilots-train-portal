'use client'

import { ClientAuthGuard } from '@/components/features/auth/ClientAuthGuard'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { ExerciseList } from '@/components/features/instructor/ExerciseList'

export default function SessionsPage() {
  const { user } = useAuth()
  const router = useRouter()

  // Дополнительная проверка, что пользователь - инструктор
  useEffect(() => {
    if (user && user.role !== 'INSTRUCTOR') {
      router.push('/')
    }
  }, [user, router])

  return (
    <ClientAuthGuard>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Сессии</h1>
          <p className="mt-2 text-gray-600">
            Список доступных упражнений для развития компетенций пилотов
          </p>
        </div>

        <ExerciseList />
      </div>
    </ClientAuthGuard>
  )
}
