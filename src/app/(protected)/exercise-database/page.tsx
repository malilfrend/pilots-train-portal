'use client'

import { ClientAuthGuard } from '@/components/features/auth/ClientAuthGuard'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { TExercise } from '@/types/exercises'
import { COMPETENCIES, CompetencyCode } from '@/types/assessment'

export default function ExerciseDatabasePage() {
  const { user } = useAuth()
  const router = useRouter()
  const [exercises, setExercises] = useState<TExercise[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editValue, setEditValue] = useState<string>('')
  const [savingId, setSavingId] = useState<number | null>(null)

  const fetchExercises = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/exercises')
      if (!response.ok) throw new Error('Ошибка при загрузке упражнений')
      const data = await response.json()
      setExercises(data.exercises)
    } catch (error) {
      console.error('Ошибка при загрузке упражнений:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleStartEdit = (exercise: TExercise) => {
    setEditingId(exercise.id)
    setEditValue(exercise.executionTime?.toString() ?? '')
  }

  const handleSave = async (exerciseId: number) => {
    setSavingId(exerciseId)
    try {
      const executionTime = editValue === '' ? null : parseInt(editValue)

      const response = await fetch('/api/exercises', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: exerciseId, executionTime }),
      })

      if (!response.ok) throw new Error('Ошибка при сохранении')

      setExercises((prev) =>
        prev.map((ex) => (ex.id === exerciseId ? { ...ex, executionTime } : ex))
      )
      setEditingId(null)
    } catch (error) {
      console.error('Ошибка при сохранении:', error)
    } finally {
      setSavingId(null)
    }
  }

  const handleCancel = () => {
    setEditingId(null)
    setEditValue('')
  }

  useEffect(() => {
    if (user && user.role !== 'INSTRUCTOR') {
      router.push('/')
    }
  }, [user, router])

  useEffect(() => {
    if (user && user.role === 'INSTRUCTOR') {
      fetchExercises()
    }
  }, [user])

  return (
    <ClientAuthGuard>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">База упражнений</h1>
          <p className="mt-2 text-gray-600">
            Все доступные упражнения с компетенциями и временем выполнения
          </p>
        </div>

        {isLoading ? (
          <div className="bg-white p-6 rounded-lg shadow flex justify-center">
            <p className="text-gray-600">Загрузка упражнений...</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold">
                      #
                    </th>
                    <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold">
                      Название упражнения
                    </th>
                    <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold">
                      Компетенции
                    </th>
                    <th className="border border-gray-300 px-4 py-3 text-center text-sm font-semibold">
                      Время выполнения (мин)
                    </th>
                    <th className="border border-gray-300 px-4 py-3 text-center text-sm font-semibold">
                      Действия
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {exercises.map((exercise, index) => (
                    <tr key={exercise.id} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-4 py-2 text-sm">{index + 1}</td>
                      <td className="border border-gray-300 px-4 py-2 text-sm">{exercise.name}</td>
                      <td className="border border-gray-300 px-4 py-2 text-sm">
                        <div className="flex flex-wrap gap-1">
                          {exercise.competencies.map((code) => (
                            <span
                              key={code}
                              className="inline-block px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded"
                              title={COMPETENCIES[code as CompetencyCode]?.name}
                            >
                              {code}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-center text-sm">
                        {editingId === exercise.id ? (
                          <input
                            type="number"
                            min={0}
                            className="w-20 p-1 border rounded text-center"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSave(exercise.id)
                              if (e.key === 'Escape') handleCancel()
                            }}
                            // eslint-disable-next-line jsx-a11y/no-autofocus
                            autoFocus
                          />
                        ) : (
                          <span>{exercise.executionTime ?? '—'}</span>
                        )}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-center text-sm">
                        {editingId === exercise.id ? (
                          <div className="flex justify-center gap-2">
                            <button
                              className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 disabled:bg-green-400"
                              onClick={() => handleSave(exercise.id)}
                              disabled={savingId === exercise.id}
                            >
                              {savingId === exercise.id ? '...' : 'Сохранить'}
                            </button>
                            <button
                              className="px-3 py-1 border border-gray-300 text-xs rounded hover:bg-gray-50"
                              onClick={handleCancel}
                            >
                              Отмена
                            </button>
                          </div>
                        ) : (
                          <button
                            className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                            onClick={() => handleStartEdit(exercise)}
                          >
                            Редактировать
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </ClientAuthGuard>
  )
}
