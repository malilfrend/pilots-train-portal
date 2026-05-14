'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { COMPETENCIES, CompetencyCode } from '@/types/assessment'
import { useAuth } from '@/contexts/auth-context'

type SessionListItem = {
  id: number
  date: string
  totalTime: number
  totalValue: number
  instructor: { firstName: string; lastName: string }
  partner: { id: number; firstName: string; lastName: string }
}

export function ProfileAssessments() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [scores, setScores] = useState<Record<CompetencyCode, number | null> | null>(null)
  const [sessions, setSessions] = useState<SessionListItem[] | null>(null)

  useEffect(() => {
    if (user?.role === 'INSTRUCTOR') {
      setLoading(false)
      return
    }
    if (!user?.pilotId) return

    async function fetchData() {
      try {
        setLoading(true)
        const [scoresRes, sessionsRes] = await Promise.all([
          fetch(`/api/assessments?pilotId=${user?.pilotId}`),
          fetch(`/api/sessions?pilotId=${user?.pilotId}`),
        ])
        if (!scoresRes.ok) throw new Error('Не удалось загрузить оценки')
        if (!sessionsRes.ok) throw new Error('Не удалось загрузить историю сессий')
        const scoresData = await scoresRes.json()
        const sessionsData = await sessionsRes.json()
        setScores(scoresData.scores)
        setSessions(sessionsData.sessions)
      } catch (err) {
        console.error(err)
        setError(err instanceof Error ? err.message : 'Не удалось загрузить данные')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [user])

  if (user?.role === 'INSTRUCTOR') {
    return (
      <div className="space-y-8 mt-8">
        <h2 className="text-2xl font-bold mb-6">Оценка компетенций</h2>
        <div className="text-center p-8 bg-blue-50 rounded-lg">
          <p>Данный раздел доступен только для пилотов.</p>
          <p className="mt-2">
            Как инструктор, вы можете просматривать историю оценок пилотов в разделе
            &apos;Пилоты&apos;.
          </p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-8 mt-8">
        <h2 className="text-2xl font-bold mb-6">Оценка компетенций пилота</h2>
        <div className="text-center p-8">
          <p>Загрузка данных...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-8 mt-8">
        <h2 className="text-2xl font-bold mb-6">Оценка компетенций пилота</h2>
        <div className="text-center p-8 text-red-500">
          <p>{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 mt-8">
      <h2 className="text-2xl font-bold mb-6">Оценка компетенций пилота</h2>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-xl font-semibold mb-4">Текущие оценки</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-4 py-2 text-left">Компетенция</th>
                <th className="border border-gray-300 px-4 py-2 text-center">Оценка</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(COMPETENCIES).map(([code, competency]) => {
                const competencyCode = code as CompetencyCode
                const score = scores?.[competencyCode]
                return (
                  <tr key={competencyCode}>
                    <td className="border border-gray-300 px-4 py-2">
                      {competencyCode} | {competency.name} | {competency.nameEn}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-center font-bold">
                      {score !== null && score !== undefined ? score : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-xl font-semibold mb-4">История сессий</h3>
        {!sessions || sessions.length === 0 ? (
          <p className="text-gray-600">У вас пока нет завершённых сессий.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-4 py-2 text-left">Дата</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Инструктор</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Напарник</th>
                  <th className="border border-gray-300 px-4 py-2 text-center">Время, мин</th>
                  <th className="border border-gray-300 px-4 py-2 text-center">Ценность</th>
                  <th className="border border-gray-300 px-4 py-2" />
                </tr>
              </thead>
              <tbody>
                {sessions.map((s) => (
                  <tr key={s.id}>
                    <td className="border border-gray-300 px-4 py-2">
                      {new Date(s.date).toLocaleString()}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      {s.instructor.lastName} {s.instructor.firstName}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      {s.partner.lastName} {s.partner.firstName}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-center">{s.totalTime}</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">{s.totalValue}</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">
                      <Link href={`/sessions/${s.id}`} className="text-blue-600 hover:underline">
                        Открыть
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
