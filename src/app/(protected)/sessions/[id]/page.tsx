'use client'

import { ClientAuthGuard } from '@/components/features/auth/ClientAuthGuard'
import { useEffect, useState, use } from 'react'
import { CompetencyCode, COMPETENCIES } from '@/types/assessment'
import { ExerciseList } from '@/components/features/instructor/ExerciseList'
import { TExercise } from '@/types/exercises'
import { useAuth } from '@/contexts/auth-context'

type SessionDetail = {
  id: number
  date: string
  totalTime: number
  totalValue: number
  isLegacy: boolean
  instructor: { firstName: string; lastName: string }
  pilot1: { id: number; firstName: string; lastName: string }
  pilot2: { id: number; firstName: string; lastName: string }
  scores: Array<{
    pilotId: number
    competencyCode: CompetencyCode
    score: number
    comment: string | null
  }>
  exercises: Array<{
    order: number
    exerciseId: number
    name: string
    executionTime: number
    value: number
    pilot: number | null
    role: 'PF' | 'PM' | null
    forBothPilots: boolean
    competencies: CompetencyCode[]
  }>
}

function ScoresColumn({
  title,
  rows,
}: {
  title: React.ReactNode
  rows: Array<{ competencyCode: CompetencyCode; score: number }>
}) {
  const byCode = new Map(rows.map((r) => [r.competencyCode, r.score]))
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-3">{title}</h3>
      <table className="min-w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-300 px-3 py-2 text-left">Компетенция</th>
            <th className="border border-gray-300 px-3 py-2 text-center">Оценка</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(COMPETENCIES).map(([code, competency]) => {
            const competencyCode = code as CompetencyCode
            const v = byCode.get(competencyCode)
            return (
              <tr key={competencyCode}>
                <td className="border border-gray-300 px-3 py-2">
                  {competencyCode} | {competency.name}
                </td>
                <td className="border border-gray-300 px-3 py-2 text-center font-semibold">
                  {v ?? '—'}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default function SessionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { user } = useAuth()
  const [session, setSession] = useState<SessionDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function fetchSession() {
      setIsLoading(true)
      try {
        const response = await fetch(`/api/sessions/${id}`)
        if (!response.ok) {
          const data = await response.json().catch(() => ({}))
          throw new Error(data.error || 'Не удалось загрузить сессию')
        }
        const data = await response.json()
        if (!cancelled) setSession(data.session)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Ошибка загрузки')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    fetchSession()
    return () => {
      cancelled = true
    }
  }, [id])

  const isInstructor = user?.role === 'INSTRUCTOR'

  return (
    <ClientAuthGuard>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold mb-6">Сессия #{id}</h1>

        {isLoading && <p className="text-gray-600">Загрузка...</p>}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {session && (
          <>
            <div className="bg-white p-6 rounded-lg shadow mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-500">Дата: </span>
                  {new Date(session.date).toLocaleString()}
                </div>
                <div>
                  <span className="text-gray-500">Инструктор: </span>
                  {session.instructor.lastName} {session.instructor.firstName}
                </div>
                <div>
                  <span className="text-gray-500">Пилот 1: </span>
                  {session.pilot1.lastName} {session.pilot1.firstName}
                </div>
                <div>
                  <span className="text-gray-500">Пилот 2: </span>
                  {session.pilot2.lastName} {session.pilot2.firstName}
                </div>
                <div>
                  <span className="text-gray-500">Время: </span>
                  {session.totalTime} мин
                </div>
                <div>
                  <span className="text-gray-500">Общая ценность: </span>
                  {session.totalValue}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <ScoresColumn
                title={
                  <>
                    Пилот 1 — {session.pilot1.lastName} {session.pilot1.firstName}
                  </>
                }
                rows={session.scores.filter((s) => s.pilotId === session.pilot1.id)}
              />
              <ScoresColumn
                title={
                  <>
                    Пилот 2 — {session.pilot2.lastName} {session.pilot2.firstName}
                  </>
                }
                rows={session.scores.filter((s) => s.pilotId === session.pilot2.id)}
              />
            </div>

            {isInstructor && session.exercises.length > 0 && (
              <>
                <h2 className="text-lg font-semibold mb-3">Упражнения</h2>
                <ExerciseList
                  exercises={session.exercises.map(
                    (e): TExercise => ({
                      id: e.exerciseId,
                      name: e.name,
                      executionTime: e.executionTime,
                      competencies: e.competencies,
                      value: e.value,
                      pilot: e.pilot === 1 || e.pilot === 2 ? e.pilot : undefined,
                      role: e.role ?? undefined,
                      forBothPilots: e.forBothPilots,
                    })
                  )}
                />
              </>
            )}
          </>
        )}
      </div>
    </ClientAuthGuard>
  )
}
