'use client'

import { useEffect, useState } from 'react'
import { TExercise } from '@/types/exercises'
import { COMPETENCIES, COMPETENCIES_CODES, CompetencyCode } from '@/types/assessment'

type TProps = {
  mode: 'create' | 'edit'
  exercise?: TExercise
  onClose: () => void
  onSaved: (exercise: TExercise) => void
  onDeleted?: (id: number) => void
}

export const ExerciseModal = ({ mode, exercise, onClose, onSaved, onDeleted }: TProps) => {
  const [name, setName] = useState(exercise?.name ?? '')
  const [executionTime, setExecutionTime] = useState<string>(
    exercise?.executionTime != null ? String(exercise.executionTime) : ''
  )
  const [competencies, setCompetencies] = useState<CompetencyCode[]>(exercise?.competencies ?? [])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const toggleCompetency = (code: CompetencyCode) => {
    setCompetencies((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (name.trim() === '') {
      setError('Название обязательно')
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        name: name.trim(),
        executionTime: executionTime === '' ? null : parseInt(executionTime),
        competencies,
      }

      const response = await fetch('/api/exercises', {
        method: mode === 'create' ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mode === 'create' ? payload : { id: exercise!.id, ...payload }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || 'Ошибка при сохранении')
      }

      const saved: TExercise = await response.json()
      onSaved(saved)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!exercise) return
    if (!confirm(`Удалить упражнение «${exercise.name}»?`)) return

    setIsDeleting(true)
    setError(null)
    try {
      const response = await fetch(`/api/exercises?id=${exercise.id}`, { method: 'DELETE' })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || 'Ошибка при удалении')
      }
      onDeleted?.(exercise.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка')
      setIsDeleting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
      <div
        className="bg-white p-6 rounded-lg shadow-lg w-full max-w-2xl mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold mb-4">
          {mode === 'create' ? 'Создание упражнения' : 'Редактирование упражнения'}
        </h2>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="exercise-name" className="block text-sm font-medium text-gray-700 mb-1">
              Название упражнения *
            </label>
            <input
              id="exercise-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2 border rounded-md"
            />
          </div>

          <div>
            <label
              htmlFor="exercise-execution-time"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Время выполнения (мин)
            </label>
            <input
              id="exercise-execution-time"
              type="number"
              min={0}
              value={executionTime}
              onChange={(e) => setExecutionTime(e.target.value)}
              className="w-full p-2 border rounded-md"
            />
          </div>

          <div>
            {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
            <label className="block text-sm font-medium text-gray-700 mb-2">Компетенции</label>
            <div className="flex flex-wrap gap-2">
              {COMPETENCIES_CODES.map((code) => {
                const active = competencies.includes(code)
                return (
                  <button
                    key={code}
                    type="button"
                    onClick={() => toggleCompetency(code)}
                    title={COMPETENCIES[code].name}
                    className={`px-2 py-0.5 text-xs rounded border transition-colors ${
                      active
                        ? 'bg-blue-100 text-blue-800 border-blue-300'
                        : 'bg-gray-50 text-gray-600 border-gray-300 hover:bg-gray-100'
                    }`}
                  >
                    {code}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex gap-3 justify-between mt-2">
            <div>
              {mode === 'edit' && onDeleted && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isSubmitting || isDeleting}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:bg-red-400"
                >
                  {isDeleting ? 'Удаление...' : 'Удалить'}
                </button>
              )}
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting || isDeleting}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={isSubmitting || isDeleting}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-400"
              >
                {isSubmitting ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
