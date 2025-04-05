'use client'

import { useState, useEffect } from 'react'
import { AssessmentTable } from './AssessmentTable'
import { Assessment, AssessmentType } from '@/types/assessment'
import { useAuth } from '@/contexts/auth-context'

const assessmentTypeLabels: Record<AssessmentType, string> = {
  EVAL: 'Этап Оценки (EVAL)',
  QUALIFICATION: 'Квалификационная проверка',
  AVIATION_EVENT: 'Авиационное событие (АС)',
  FLIGHT_DATA_ANALYSIS: 'Программа анализа полетных данных',
}

export function ProfileAssessments() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [assessments, setAssessments] = useState<Record<AssessmentType, Assessment | null>>({
    EVAL: null,
    QUALIFICATION: null,
    AVIATION_EVENT: null,
    FLIGHT_DATA_ANALYSIS: null,
  })
  const [generalAssessment, setGeneralAssessment] = useState<Assessment | null>(null)

  useEffect(() => {
    // Если пользователь - инструктор, не делаем запрос на получение оценок
    if (user?.role === 'INSTRUCTOR') {
      setLoading(false)
      return
    }

    async function fetchAssessments() {
      try {
        setLoading(true)
        const response = await fetch('/api/assessments')

        if (!response.ok) {
          throw new Error('Не удалось загрузить данные')
        }

        const data = await response.json()
        setAssessments(data.assessments)
        setGeneralAssessment(data.generalAssessment)
      } catch (err) {
        console.error('Ошибка при загрузке оценок:', err)
        setError('Не удалось загрузить данные оценок')
      } finally {
        setLoading(false)
      }
    }

    fetchAssessments()
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

  return (
    <div className="space-y-8 mt-8">
      <h2 className="text-2xl font-bold mb-6">Оценка компетенций пилота</h2>

      <div className="mb-12">
        <AssessmentTable title={assessmentTypeLabels.EVAL} assessment={assessments.EVAL} />
        <div className="mt-4 p-4 bg-gray-50 rounded-md">
          <p className="text-sm italic">
            Этап оценки (EVAL) — это формальная оценка компетенций пилота, проводимая после
            завершения определенного этапа обучения или периода работы.
          </p>
        </div>
      </div>

      <div className="mb-12">
        <AssessmentTable
          title={assessmentTypeLabels.QUALIFICATION}
          assessment={assessments.QUALIFICATION}
        />
        <div className="mt-4 p-4 bg-gray-50 rounded-md">
          <p className="text-sm italic">
            Квалификационная проверка — официальная процедура подтверждения квалификации пилота,
            проводимая в соответствии с авиационными правилами.
          </p>
        </div>
      </div>

      <div className="mb-12">
        <AssessmentTable
          title={assessmentTypeLabels.AVIATION_EVENT}
          assessment={assessments.AVIATION_EVENT}
        />
        <div className="mt-4 p-4 bg-gray-50 rounded-md">
          <p className="text-sm italic">
            Оценка компетенций пилота после авиационного события или инцидента, направленная на
            выявление потенциальных областей для улучшения.
          </p>
        </div>
      </div>

      <div className="mb-12">
        <AssessmentTable
          title={assessmentTypeLabels.FLIGHT_DATA_ANALYSIS}
          assessment={assessments.FLIGHT_DATA_ANALYSIS}
        />
        <div className="mt-4 p-4 bg-gray-50 rounded-md">
          <p className="text-sm italic">
            Анализ полетных данных позволяет объективно оценить технику пилотирования и соблюдение
            стандартных операционных процедур на основе фактических данных полета.
          </p>
        </div>
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
