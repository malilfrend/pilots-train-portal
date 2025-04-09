'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'

interface ClientAuthGuardProps {
  children: React.ReactNode
}

export function ClientAuthGuard({ children }: ClientAuthGuardProps) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Проверяем состояние аутентификации только после завершения загрузки
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  // Если данные загружаются, показываем индикатор загрузки
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-gray-500">Загрузка...</p>
        </div>
      </div>
    )
  }

  // Если пользователь не авторизован, ничего не рендерим
  // (редирект произойдет в useEffect)
  if (!user) {
    return null
  }

  // Если пользователь авторизован, показываем содержимое
  return <>{children}</>
}
