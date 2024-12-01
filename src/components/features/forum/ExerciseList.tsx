'use client'

import { useEffect, useState } from 'react'
import { Exercise } from '@/types/forum'
import { ExerciseCard } from './ExerciseCard'

interface ExerciseListProps {
  sessionId: number
}

export function ExerciseList({ sessionId }: ExerciseListProps) {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchExercises() {
      try {
        const response = await fetch(`/api/sessions/${sessionId}/exercises?sessionId=${sessionId}`)
        if (!response.ok) throw new Error('Ошибка загрузки упражнений')
        const data = await response.json()
        setExercises(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Произошла ошибка')
      } finally {
        setLoading(false)
      }
    }

    fetchExercises()
  }, [sessionId])

  if (loading) return <div>Загрузка...</div>
  if (error) return <div className="text-red-500">Ошибка: {error}</div>

  return (
    <div className="space-y-6 bg-white rounded-lg shadow">
      {exercises.map((exercise) => (
        <ExerciseCard
          key={exercise.id}
          exercise={exercise}
          onCommentAdded={(newComment) => {
            setExercises(
              exercises.map((ex) =>
                ex.id === exercise.id ? { ...ex, comments: [newComment, ...ex.comments] } : ex
              )
            )
          }}
        />
      ))}
    </div>
  )
}
