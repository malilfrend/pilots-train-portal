'use client'

import { ClientAuthGuard } from '@/components/features/auth/ClientAuthGuard'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function AssessmentsPage() {
  const { user } = useAuth()
  const router = useRouter()

  // Дополнительная проверка, что пользователь - инструктор
  useEffect(() => {
    if (user && user.role !== 'INSTRUCTOR') {
      router.push('/profile')
    }
  }, [user, router])

  return (
    <ClientAuthGuard>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold mb-6">Управление оценками пилотов</h1>
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-600 mb-4">
            Здесь будет интерфейс для создания и управления оценками пилотов. Эта страница доступна
            только инструкторам.
          </p>
          {/* Здесь будет форма создания оценок и список существующих оценок */}
          <div className="p-4 bg-blue-50 rounded-md mt-4">
            <p className="text-sm text-blue-700">Функциональность находится в разработке.</p>
          </div>
        </div>
      </div>
    </ClientAuthGuard>
  )
}
