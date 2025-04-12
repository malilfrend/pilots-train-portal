'use client'

import { useAuth } from '@/contexts/auth-context'
import { useState } from 'react'
import { updateProfileSchema } from '@/lib/validations/auth'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'

type FormValues = z.infer<typeof updateProfileSchema>

export function ProfileInfo() {
  const { user, updateProfile } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const roleLabels = {
    PILOT: 'Пилот',
    INSTRUCTOR: 'Инструктор',
    SUPER_ADMIN: 'Администратор',
  }

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      university: user?.university || '',
      company: user?.company || '',
      position: user?.position || '',
      experience: user?.experience || '',
    },
  })

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true)
    setError(null)

    try {
      await updateProfile(data)
      setIsEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка при обновлении профиля')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    reset({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      university: user?.university || '',
      company: user?.company || '',
      position: user?.position || '',
      experience: user?.experience || '',
    })
    setIsEditing(false)
    setError(null)
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Профиль пользователя</h2>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Редактировать
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {isEditing ? (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm text-gray-500 mb-1">
                Имя
              </label>
              <input
                id="firstName"
                {...register('firstName')}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.firstName && (
                <p className="text-red-500 text-xs mt-1">{errors.firstName.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm text-gray-500 mb-1">
                Фамилия
              </label>
              <input
                id="lastName"
                {...register('lastName')}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.lastName && (
                <p className="text-red-500 text-xs mt-1">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-500 mb-1">Email</p>
            <p className="font-medium">{user?.email || '—'}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500 mb-1">Роль</p>
            <p className="font-medium">{user?.role ? roleLabels[user.role] : '—'}</p>
          </div>

          <div>
            <label htmlFor="university" className="block text-sm text-gray-500 mb-1">
              Университет
            </label>
            <input
              id="university"
              {...register('university')}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="company" className="block text-sm text-gray-500 mb-1">
              Компания
            </label>
            <input
              id="company"
              {...register('company')}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="position" className="block text-sm text-gray-500 mb-1">
              Должность
            </label>
            <input
              id="position"
              {...register('position')}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="experience" className="block text-sm text-gray-500 mb-1">
              Опыт
            </label>
            <textarea
              id="experience"
              {...register('experience')}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
              disabled={isSubmitting}
            >
              Отмена
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-400"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </form>
      ) : (
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
          <div>
            <p className="text-sm text-gray-500">Должность</p>
            <p className="font-medium">{user?.position || '—'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Опыт</p>
            <p className="font-medium">{user?.experience || '—'}</p>
          </div>
        </div>
      )}
    </div>
  )
}
