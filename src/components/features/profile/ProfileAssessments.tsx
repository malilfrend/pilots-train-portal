'use client'

import { useState, useEffect } from 'react'
import { AssessmentTable } from './AssessmentTable'
import {
  Assessment,
  ASSESSMENT_TYPES,
  ASSESSMENT_TYPES_LABELS,
  AssessmentSourceType,
  COMPETENCIES,
  CompetencyCode,
} from '@/types/assessment'
import { useAuth } from '@/contexts/auth-context'

export function ProfileAssessments() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [assessments, setAssessments] = useState<Record<AssessmentSourceType, Assessment | null>>({
    PC: null,
    FDM: null,
    EVAL: null,
    ASR: null,
  })
  const [generalAssessment, setGeneralAssessment] = useState<Assessment | null>(null)

  useEffect(() => {
    // Если пользователь - инструктор, не делаем запрос на получение оценок
    if (user?.role === 'INSTRUCTOR') {
      setLoading(false)
      return
    }

    async function fetchData() {
      try {
        setLoading(true)

        // Получаем оценки
        const assessmentsResponse = await fetch(`/api/assessments?pilotId=${user?.pilotId}`)
        if (!assessmentsResponse.ok) {
          throw new Error('Не удалось загрузить данные оценок')
        }
        const assessmentsData = await assessmentsResponse.json()

        setAssessments(assessmentsData.assessments)
        setGeneralAssessment(assessmentsData.generalAssessment)
      } catch (err) {
        console.error('Ошибка при загрузке данных:', err)
        setError('Не удалось загрузить необходимые данные')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user])

  // Если пользователь - инструктор, показываем соответствующее сообщение
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

  const getCurrentScore = (
    sourceType: AssessmentSourceType,
    competencyCode: CompetencyCode
  ): number | null => {
    return assessments[sourceType]?.competencyScores[competencyCode] ?? null
  }

  return (
    <div className="space-y-8 mt-8">
      <h2 className="text-2xl font-bold mb-6">Оценка компетенций пилота</h2>

      <div className="space-y-12 mb-6">
        {ASSESSMENT_TYPES.map((sourceType) => {
          return (
            <div key={sourceType} className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-xl font-semibold mb-4">
                {ASSESSMENT_TYPES_LABELS[sourceType] || sourceType}
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse border border-gray-300 mb-6">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 px-4 py-2 text-center">Компетенция</th>
                      <th className="border border-gray-300 px-4 py-2 text-center">Оценка (2–5)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(COMPETENCIES).map(([code, competency]) => {
                      const competencyCode = code as CompetencyCode
                      return (
                        <tr key={competencyCode}>
                          <td className="border border-gray-300 px-4 py-2">
                            {competencyCode} | {competency.name} | {competency.nameEn}
                          </td>
                          <td className="border border-gray-300 px-4 py-2 text-center">
                            {getCurrentScore(sourceType, competencyCode)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>

                <div className="mb-6">
                  <label
                    htmlFor="instructorComment"
                    className="block text-lg font-semibold text-gray-700 mb-2"
                  >
                    Комментарий инструктора
                  </label>
                  <span>{assessments[sourceType]?.instructorComment}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div>
        <AssessmentTable title="Общая таблица компетенций" assessment={generalAssessment} />
        <div className="mt-4 p-4 bg-gray-50 rounded-md">
          <p className="text-sm italic">
            Сводная таблица компетенций отражает обобщенную оценку навыков пилота по всем ключевым
            областям компетенций.
          </p>
        </div>
      </div>
    </div>
  )
}
