'use client'

import { useState, useEffect } from 'react'
import { COMPETENCIES, CompetencyCode } from '@/types/assessment'
import { useAuth } from '@/contexts/auth-context'

export function ProfileAssessments() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [scores, setScores] = useState<Record<CompetencyCode, number | null> | null>(null)

  useEffect(() => {
    if (user?.role === 'INSTRUCTOR') {
      setLoading(false)
      return
    }

    async function fetchData() {
      try {
        setLoading(true)

        const response = await fetch(`/api/assessments?pilotId=${user?.pilotId}`)
        if (!response.ok) {
          throw new Error('Не удалось загрузить данные оценок')
        }
        const data = await response.json()

        setScores(data.scores)
      } catch (err) {
        console.error('Ошибка при загрузке данных:', err)
        setError('Не удалось загрузить необходимые данные')
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
            Как инструктор, вы можете создавать и просматривать оценки пилотов в разделе
            &apos;Оценки&apos;.
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
    </div>
  )
}
