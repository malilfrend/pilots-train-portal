'use client'

import { useState, useEffect } from 'react'
import { AssessmentTable } from './AssessmentTable'
import { Assessment, AssessmentSourceType, CompetencyCode } from '@/types/assessment'
import { useAuth } from '@/contexts/auth-context'

const assessmentTypeLabels: Record<AssessmentSourceType, string> = {
  KP: 'Квалификационная проверка (КП)',
  PADP: 'Программа анализа данных полета (ПАДП)',
  EVAL: 'Этап Оценки (EVAL)',
  AS: 'Авиационное событие (АС)',
}

export function ProfileAssessments() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [assessments, setAssessments] = useState<Record<AssessmentSourceType, Assessment | null>>({
    KP: null,
    PADP: null,
    EVAL: null,
    AS: null,
  })
  const [generalAssessment, setGeneralAssessment] = useState<Assessment | null>(null)
  const [competencyWeights, setCompetencyWeights] = useState<
    Record<CompetencyCode, Record<string, number>>
  >({} as Record<CompetencyCode, Record<string, number>>)

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
        const assessmentsResponse = await fetch('/api/assessments')
        if (!assessmentsResponse.ok) {
          throw new Error('Не удалось загрузить данные оценок')
        }
        const assessmentsData = await assessmentsResponse.json()

        // Получаем веса компетенций
        const weightsResponse = await fetch('/api/competency-weights')
        if (!weightsResponse.ok) {
          throw new Error('Не удалось загрузить данные о весах компетенций')
        }
        const weightsData = await weightsResponse.json()

        setAssessments(assessmentsData.assessments)
        setGeneralAssessment(assessmentsData.generalAssessment)
        setCompetencyWeights(weightsData.weights)
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

  // Функция для расчета взвешенного среднего значения для компетенции
  const calculateWeightedAverage = (competencyCode: CompetencyCode) => {
    let sum = 0
    let totalWeight = 0

    // Проходим по всем источникам для данной компетенции
    Object.entries(assessmentTypeLabels).forEach(([type, _]) => {
      const sourceType = type as AssessmentSourceType
      const assessment = assessments[sourceType]
      if (!assessment) return

      const score = assessment.competencyScores.find(
        (cs) => cs.competencyCode === competencyCode
      )?.score
      if (score === undefined || score === null) return

      const weight = competencyWeights[competencyCode]?.[sourceType] || 0
      sum += score * weight
      totalWeight += weight
    })

    return totalWeight > 0 ? (sum / totalWeight).toFixed(2) : 'Н/Д'
  }

  // Создаем отдельную таблицу для каждой компетенции
  const competencyCodes: CompetencyCode[] = [
    'KNO',
    'PRO',
    'FPA',
    'FPM',
    'COM',
    'LDR',
    'WSA',
    'WLM',
    'PSD',
  ]
  const competencyNames: Record<CompetencyCode, string> = {
    KNO: 'Применение знаний (Knowledge)',
    PRO: 'Следование правилам и процедурам (Procedures)',
    FPA: 'Пилотирование в автоматическом режиме (Flight Path Automation)',
    FPM: 'Пилотирование в ручном режиме (Flight Path Manual)',
    COM: 'Взаимодействие (Communication)',
    LDR: 'Лидерство и работа в команде (Leadership)',
    WSA: 'Ситуационная осознанность (Workload and Situation Awareness)',
    WLM: 'Управление рабочей нагрузкой (Workload Management)',
    PSD: 'Разрешение проблем и принятие решений (Problem Solving and Decision)',
  }

  return (
    <div className="space-y-8 mt-8">
      <h2 className="text-2xl font-bold mb-6">Оценка компетенций пилота</h2>

      {competencyCodes.map((code) => (
        <div key={code} className="mb-12">
          <h3 className="text-xl font-semibold mb-4">{competencyNames[code]}</h3>

          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-4 py-2 text-left">Источник</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Оценка (2–5)</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Вес</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Среднее взвешенное</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(assessmentTypeLabels).map(([type, label]) => {
                  const sourceType = type as AssessmentSourceType
                  const assessment = assessments[sourceType]
                  const score =
                    assessment?.competencyScores.find((cs) => cs.competencyCode === code)?.score ||
                    null
                  const weight = competencyWeights[code]?.[sourceType] || 0
                  const weightedScore = score !== null ? (score * weight).toFixed(2) : '—'

                  return (
                    <tr key={type}>
                      <td className="border border-gray-300 px-4 py-2">{sourceType}</td>
                      <td className="border border-gray-300 px-4 py-2 text-center">
                        {score !== null ? score : '—'}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-center">
                        {weight.toFixed(2)}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-center">
                        {weightedScore}
                      </td>
                    </tr>
                  )
                })}
                <tr className="bg-green-50">
                  <td className="border border-gray-300 px-4 py-2 font-semibold">ИТОГ</td>
                  <td className="border border-gray-300 px-4 py-2"></td>
                  <td className="border border-gray-300 px-4 py-2"></td>
                  <td className="border border-gray-300 px-4 py-2 text-center font-bold">
                    {calculateWeightedAverage(code)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-4 p-4 bg-gray-50 rounded-md">
            <p className="text-sm italic">{getCompetencyDescription(code)}</p>
          </div>
        </div>
      ))}

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

// Вспомогательная функция для получения описания компетенции
function getCompetencyDescription(code: CompetencyCode): string {
  const descriptions: Record<CompetencyCode, string> = {
    KNO: 'Применение знаний отражает способность пилота применять теоретические знания в практических ситуациях полета и принятии решений.',
    PRO: 'Следование правилам и процедурам оценивает способность пилота точно выполнять стандартные операционные процедуры и авиационные правила.',
    FPA: 'Пилотирование в автоматическом режиме оценивает навыки использования автоматических систем управления полетом и понимание их работы.',
    FPM: 'Пилотирование в ручном режиме показывает способность пилота управлять воздушным судном без использования автоматики.',
    COM: 'Взаимодействие оценивает качество коммуникации пилота с членами экипажа, диспетчерами и другими участниками полета.',
    LDR: 'Лидерство и работа в команде отражает способность эффективно руководить экипажем и взаимодействовать в команде.',
    WSA: 'Ситуационная осознанность показывает, насколько хорошо пилот воспринимает и понимает текущую ситуацию в полете.',
    WLM: 'Управление рабочей нагрузкой оценивает способность пилота эффективно распределять внимание и ресурсы в различных условиях полета.',
    PSD: 'Разрешение проблем и принятие решений отражает способность анализировать ситуации, определять варианты действий и принимать обоснованные решения.',
  }

  return descriptions[code]
}
