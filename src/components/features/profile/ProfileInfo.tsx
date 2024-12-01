'use client'

import { useAuth } from '@/contexts/auth-context'

export function ProfileInfo() {
  const { user } = useAuth()

  const roleLabels = {
    PILOT: 'Пилот',
    INSTRUCTOR: 'Инструктор',
    SUPER_ADMIN: 'Администратор',
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6">Профиль пользователя</h2>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Имя</p>
            <p className="font-medium">{user?.firstName || '—'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Фамилия</p>
            <p className="font-medium">{user?.lastName || '—'}</p>
          </div>
        </div>
        <div>
          <p className="text-sm text-gray-500">Email</p>
          <p className="font-medium">{user?.email || '—'}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Роль</p>
          <p className="font-medium">{user?.role ? roleLabels[user.role] : '—'}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Университет</p>
          <p className="font-medium">{user?.university || '—'}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Компания</p>
          <p className="font-medium">{user?.company || '—'}</p>
        </div>
      </div>
    </div>
  )
}
