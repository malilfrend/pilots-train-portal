'use client'

import { useState, useEffect } from 'react'
import { TExercise } from '@/types/exercises'
import { COMPETENCIES, CompetencyCode } from '@/types/assessment'

type TProps = {
  excludeIds: Set<number>
  onAdd: (exercise: TExercise) => void
  onClose: () => void
}

export const AddExerciseModal = ({ excludeIds, onAdd, onClose }: TProps) => {
  const [allExercises, setAllExercises] = useState<TExercise[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const fetchExercises = async () => {
      try {
        const response = await fetch('/api/exercises')
        if (!response.ok) throw new Error('Ошибка загрузки')
        const data = await response.json()
        setAllExercises(data.exercises)
      } catch (error) {
        console.error('Ошибка при загрузке упражнений:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchExercises()
  }, [])

  const filtered = allExercises.filter(
    (ex) =>
      !excludeIds.has(ex.id) &&
      (search === '' || ex.name.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[80vh] flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-semibold">Добавить упражнение</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            &times;
          </button>
        </div>

        <div className="p-4 border-b">
          <input
            type="text"
            placeholder="Поиск по названию..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full p-2 border rounded-md"
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus
          />
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <p className="text-gray-600 text-center">Загрузка...</p>
          ) : filtered.length === 0 ? (
            <p className="text-gray-600 text-center">Нет доступных упражнений</p>
          ) : (
            <div className="space-y-2">
              {filtered.map((exercise) => (
                <div
                  key={exercise.id}
                  className="p-3 border rounded-lg hover:bg-blue-50 cursor-pointer transition-colors flex justify-between items-center"
                  onClick={() => onAdd(exercise)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') onAdd(exercise)
                  }}
                  tabIndex={0}
                  role="button"
                >
                  <div>
                    <p className="font-medium text-sm">{exercise.name}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
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
                  </div>
                  <button
                    type="button"
                    className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 shrink-0"
                    onClick={(e) => {
                      e.stopPropagation()
                      onAdd(exercise)
                    }}
                  >
                    Добавить
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
