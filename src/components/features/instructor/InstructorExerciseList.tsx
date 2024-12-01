'use client'

import { useEffect, useState } from 'react'
import { Exercise } from '@/types/forum'
import { InstructorExerciseCard } from './InstructorExerciseCard'

interface InstructorExerciseListProps {
  sessionId: number
}

export function InstructorExerciseList({ sessionId }: InstructorExerciseListProps) {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchExercises() {
      try {
        const response = await fetch(`/api/sessions/${sessionId}/exercises`)
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

  if (loading) return <div className="p-6">Загрузка...</div>
  if (error) return <div className="p-6 text-red-500">Ошибка: {error}</div>

  return (
    <div className="divide-y">
      {exercises.map((exercise) => (
        <InstructorExerciseCard
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
