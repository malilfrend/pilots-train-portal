'use client'

import { ClientAuthGuard } from '@/components/features/auth/ClientAuthGuard'
import { ExerciseModal } from '@/components/features/instructor/ExerciseModal'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { TExercise } from '@/types/exercises'
import { COMPETENCIES, CompetencyCode } from '@/types/assessment'

type ModalState = { mode: 'create' } | { mode: 'edit'; exercise: TExercise } | null

export default function ExerciseDatabasePage() {
  const { user } = useAuth()
  const router = useRouter()
  const [exercises, setExercises] = useState<TExercise[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [modalState, setModalState] = useState<ModalState>(null)

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 300)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

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

  const handleSaved = () => {
    setModalState(null)
    fetchExercises()
  }

  const handleDeleted = () => {
    setModalState(null)
    fetchExercises()
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
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">База упражнений</h1>
            <p className="mt-2 text-gray-600">
              Все доступные упражнения с компетенциями и временем выполнения
            </p>
          </div>
          <button
            onClick={() => setModalState({ mode: 'create' })}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors whitespace-nowrap"
          >
            + Создать упражнение
          </button>
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
                      ID
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
                  {exercises.map((exercise) => (
                    <tr key={exercise.id} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-4 py-2 text-sm">{exercise.id}</td>
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
                        <span>{exercise.executionTime ?? '—'}</span>
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-center text-sm">
                        <button
                          className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                          onClick={() => setModalState({ mode: 'edit', exercise })}
                        >
                          Редактировать
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 z-50 px-4 py-2 bg-blue-600 text-white text-sm rounded-full shadow-lg hover:bg-blue-700"
          aria-label="Наверх"
        >
          ↑ Наверх
        </button>
      )}
      {modalState && (
        <ExerciseModal
          mode={modalState.mode}
          exercise={modalState.mode === 'edit' ? modalState.exercise : undefined}
          onClose={() => setModalState(null)}
          onSaved={handleSaved}
          onDeleted={handleDeleted}
        />
      )}
    </ClientAuthGuard>
  )
}
