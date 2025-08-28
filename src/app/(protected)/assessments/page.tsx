'use client'

import { ClientAuthGuard } from '@/components/features/auth/ClientAuthGuard'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import {
  Assessment,
  AssessmentSourceType,
  CompetencyCode,
  COMPETENCIES,
  ASSESSMENT_TYPES,
  ASSESSMENT_TYPES_LABELS,
} from '@/types/assessment'
import { TPilot } from '@/types/pilots'
import { INITIAL_COMPETENCY_SCORES } from '@/constants/initials-competency'

// Интерфейс для запроса на создание/обновление оценки
interface SaveAssessmentRequest {
  pilotId: number
  type: AssessmentSourceType
  date: string
  competencyScores: {
    competencyCode: CompetencyCode
    score: number | null
  }[]
  comment?: string
}

export default function AssessmentsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [pilots, setPilots] = useState<TPilot[]>([])
  const [selectedPilot, setSelectedPilot] = useState<TPilot | null>(null)
  const [pilotAssessments, setPilotAssessments] = useState<Record<
    AssessmentSourceType,
    Assessment | null
  > | null>(null)

  const [scores, setScores] = useState<
    Record<AssessmentSourceType, Record<CompetencyCode, number | null>>
  >({
    PC: INITIAL_COMPETENCY_SCORES,
    FDM: INITIAL_COMPETENCY_SCORES,
    EVAL: INITIAL_COMPETENCY_SCORES,
    ASR: INITIAL_COMPETENCY_SCORES,
  })

  const [comments, setComments] = useState<Record<AssessmentSourceType, string>>({
    PC: '',
    FDM: '',
    EVAL: '',
    ASR: '',
  })

  const [weights, setWeights] = useState<
    Record<CompetencyCode, Record<AssessmentSourceType, number>>
  >({} as Record<CompetencyCode, Record<AssessmentSourceType, number>>)

  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const fetchPilots = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/pilots')

      if (!response.ok) {
        throw new Error('Ошибка при загрузке списка пилотов')
      }

      const data = await response.json()
      setPilots(data.pilots)
    } catch (error) {
      console.error('Ошибка при загрузке пилотов:', error)
      setErrorMessage('Не удалось загрузить список пилотов')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchPilotAssessments = async (pilotId: number) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/assessments?pilotId=${pilotId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Ошибка при загрузке оценок пилота')
      }

      const data = await response.json()
      setPilotAssessments(
        data.assessments || {
          PC: null,
          FDM: null,
          EVAL: null,
          ASR: null,
        }
      )
    } catch (error) {
      console.error('Ошибка при загрузке оценок пилота:', error)
      setErrorMessage('Не удалось загрузить оценки пилота')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchWeights = async () => {
    try {
      const response = await fetch('/api/competency-weights')

      if (!response.ok) {
        console.error('Ошибка при загрузке весов компетенций')
        return
      }

      const data = await response.json()
      setWeights(data.weights)
    } catch (error) {
      console.error('Ошибка при загрузке весов компетенций:', error)
    }
  }

  // Получить вес для компетенции и источника
  const getWeight = (competencyCode: CompetencyCode, sourceType: AssessmentSourceType): number => {
    return weights[competencyCode]?.[sourceType] || 0
  }

  // Рассчитать средневзвешенное значение для компетенции
  const calculateAverage = (competencyCode: CompetencyCode): number => {
    let sum = 0
    let totalWeight = 0

    // Проходим по всем источникам
    ASSESSMENT_TYPES.forEach((sourceType) => {
      const score = getCurrentScore(sourceType, competencyCode)
      if (score === null) return

      const weight = getWeight(competencyCode, sourceType)
      sum += score * weight
      totalWeight += weight
    })

    return totalWeight > 0 ? Math.round((sum / totalWeight) * 10) / 10 : 0
  }

  const handleScoreChange = (
    sourceType: AssessmentSourceType,
    competencyCode: CompetencyCode,
    value: number | null
  ) => {
    setScores((prev) => ({
      ...prev,
      [sourceType]: {
        ...prev[sourceType],
        [competencyCode]: value,
      },
    }))
  }

  const handleSubmit = () => {
    setShowConfirmModal(true)
  }

  const saveAssessment = async () => {
    if (!selectedPilot) return

    setIsSaving(true)
    setErrorMessage(null)

    try {
      // Создаем запросы для каждого типа оценки
      const savePromises = ASSESSMENT_TYPES.map(async (type) => {
        // Пропускаем типы без оценок
        if (Object.values(scores[type]).every((score) => score === null)) {
          return null
        }

        // Преобразуем scores в формат CompetencyScore[]
        const competencyScores = Object.entries(scores[type])
          .map(([code, score]) => ({
            competencyCode: code as CompetencyCode,
            score,
          }))
          .filter((item) => item.score !== null)

        // Если нет оценок, пропускаем
        if (competencyScores.length === 0) {
          return null
        }

        const assessmentData: SaveAssessmentRequest = {
          pilotId: selectedPilot.id,
          type,
          date: new Date().toISOString(),
          competencyScores,
          comment: comments[type] || undefined,
        }

        const response = await fetch('/api/assessments', {
          method: isEditing ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(assessmentData),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || `Ошибка при сохранении оценки типа ${type}`)
        }

        return response.json()
      })

      // Ждем завершения всех запросов
      await Promise.all(savePromises.filter(Boolean))

      // После успешного сохранения обновляем данные пилота
      await fetchPilotAssessments(selectedPilot.id)

      // Сбрасываем модальное окно
      setShowConfirmModal(false)

      // Выводим сообщение об успешном сохранении
      alert(`Оценки успешно ${isEditing ? 'обновлены' : 'сохранены'}!`)
    } catch (error) {
      console.error('Ошибка при сохранении оценок:', error)
      setErrorMessage(
        `Ошибка при ${isEditing ? 'обновлении' : 'сохранении'} оценок: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`
      )
    } finally {
      setIsSaving(false)
    }
  }

  // Получить текущее значение оценки для отображения в таблице
  const getCurrentScore = (
    sourceType: AssessmentSourceType,
    competencyCode: CompetencyCode
  ): number | null => {
    return scores[sourceType]?.[competencyCode] ?? null
  }

  // Дополнительная проверка, что пользователь - инструктор
  useEffect(() => {
    if (user && user.role !== 'INSTRUCTOR') {
      router.push('/')
    }
  }, [user, router])

  // Загрузка списка всех пилотов
  useEffect(() => {
    if (user && user.role === 'INSTRUCTOR') {
      fetchPilots()
      fetchWeights()
    }
  }, [user])

  // Загрузка оценок выбранного пилота
  useEffect(() => {
    if (selectedPilot) {
      fetchPilotAssessments(selectedPilot.id)
    }
  }, [selectedPilot])

  // Загрузка данных выбранной оценки для редактирования
  useEffect(() => {
    // Если есть данные, заполняем все формы одновременно
    if (pilotAssessments) {
      // Создаем структуру для оценок всех типов
      const allScores: Record<AssessmentSourceType, Record<CompetencyCode, number | null>> = {
        PC: INITIAL_COMPETENCY_SCORES,
        FDM: INITIAL_COMPETENCY_SCORES,
        EVAL: INITIAL_COMPETENCY_SCORES,
        ASR: INITIAL_COMPETENCY_SCORES,
      }

      // Заполняем данными из загруженных оценок
      let hasAnyAssessment = false
      ASSESSMENT_TYPES.forEach((type) => {
        const assessment = pilotAssessments[type]
        if (assessment) {
          hasAnyAssessment = true
          allScores[type] = assessment.competencyScores
        }
      })

      setScores(allScores)

      Object.entries(pilotAssessments).forEach(([type, assessment]) => {
        if (assessment) {
          setComments((prev) => ({ ...prev, [type]: assessment.instructorComment || '' }))
        }
      })

      setIsEditing(hasAnyAssessment)
    }
  }, [pilotAssessments])

  return (
    <ClientAuthGuard>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold mb-6">Управление оценками пилотов</h1>

        {errorMessage && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {errorMessage}
          </div>
        )}

        {isLoading && !selectedPilot ? (
          <div className="bg-white p-6 rounded-lg shadow mb-6 flex justify-center">
            <p className="text-gray-600">Загрузка списка пилотов...</p>
          </div>
        ) : (
          // Выбор пилота
          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <h2 className="text-lg font-semibold mb-4">Выберите пилота для оценки</h2>
            {pilots.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pilots.map((pilot) => (
                  <div
                    key={pilot.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedPilot?.id === pilot.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                    }`}
                    onClick={() => setSelectedPilot(pilot)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        setSelectedPilot(pilot)
                      }
                    }}
                    tabIndex={0}
                    role="button"
                    aria-pressed={selectedPilot?.id === pilot.id}
                  >
                    <p className="font-medium">
                      {pilot.profile.lastName} {pilot.profile.firstName}
                    </p>
                    <p className="text-sm text-gray-600">
                      {pilot.profile.position || 'Должность не указана'}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">Нет доступных пилотов для оценки</p>
            )}
          </div>
        )}

        {selectedPilot && (
          <>
            {isLoading ? (
              <div className="bg-white p-6 rounded-lg shadow mb-6 flex justify-center">
                <p className="text-gray-600">Загрузка данных пилота...</p>
              </div>
            ) : (
              <>
                {/* Информация о пилоте */}
                <div className="bg-white p-6 rounded-lg shadow mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold">
                      Оценка пилота: {selectedPilot.profile.lastName}{' '}
                      {selectedPilot.profile.firstName}
                    </h2>
                  </div>

                  {isEditing && (
                    <div className="mb-4 bg-blue-50 p-3 rounded-md">
                      <p className="text-sm text-blue-700">
                        Редактирование существующих оценок пилота
                      </p>
                    </div>
                  )}
                </div>

                {/* Таблицы по источникам */}
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
                                <th className="border border-gray-300 px-4 py-2 text-center">
                                  Компетенция
                                </th>
                                <th className="border border-gray-300 px-4 py-2 text-center">
                                  Оценка (2–5)
                                </th>
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
                                      <select
                                        className="border rounded p-1 w-full"
                                        value={getCurrentScore(sourceType, competencyCode) ?? ''}
                                        onChange={(e) =>
                                          handleScoreChange(
                                            sourceType,
                                            competencyCode,
                                            e.target.value === '' ? null : parseInt(e.target.value)
                                          )
                                        }
                                      >
                                        <option value="">Не выбрано</option>
                                        {[2, 3, 4, 5].map((score) => (
                                          <option key={score} value={score}>
                                            {score}
                                          </option>
                                        ))}
                                      </select>
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
                            <textarea
                              id="instructorComment"
                              className="w-full p-2 border rounded-md"
                              rows={4}
                              value={comments[sourceType]}
                              onChange={(e) =>
                                setComments({ ...comments, [sourceType]: e.target.value })
                              }
                              placeholder="Введите комментарий к оценке..."
                            />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Итоговая таблица компетенций */}
                <div className="bg-white p-6 rounded-lg shadow mb-6">
                  <h3 className="text-xl font-semibold mb-4">Общая таблица компетенций</h3>

                  <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse border border-gray-300">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border border-gray-300 px-4 py-2 text-left">
                            Оценка компетенций
                          </th>
                          <th className="border border-gray-300 px-4 py-2 text-center">
                            Итоговая оценка
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(COMPETENCIES).map(([code, competency]) => {
                          const competencyCode = code as CompetencyCode
                          return (
                            <tr key={competencyCode}>
                              <td className="border border-gray-300 px-4 py-2">
                                <div className="font-medium">
                                  {competencyCode} | {competency.name} | {competency.nameEn}
                                </div>
                              </td>
                              <td className="border border-gray-300 px-4 py-2 text-center font-bold">
                                {calculateAverage(competencyCode)}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-4 p-4 bg-gray-50 rounded-md">
                    <p className="text-sm italic">
                      Сводная таблица компетенций отражает обобщенную оценку навыков пилота по всем
                      ключевым областям компетенций.
                    </p>
                  </div>
                </div>

                {/* Комментарий и кнопка сохранения */}
                <div className="bg-white p-6 rounded-lg shadow mb-6">
                  {/* Кнопка сохранения */}
                  <div className="flex justify-end">
                    <button
                      type="button"
                      className="px-6 py-3 bg-blue-600 text-white text-lg font-medium rounded-md hover:bg-blue-700 transition-colors"
                      onClick={handleSubmit}
                      disabled={isSaving}
                    >
                      {isSaving
                        ? 'Сохранение...'
                        : `${isEditing ? 'Обновить' : 'Сохранить'} оценку`}
                    </button>
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {/* Модальное окно подтверждения */}
        {showConfirmModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
              <h3 className="text-lg font-semibold mb-4">Подтверждение сохранения</h3>
              <p className="text-gray-600 mb-4">
                Вы уверены, что хотите {isEditing ? 'обновить' : 'сохранить'} оценку для пилота{' '}
                {selectedPilot?.profile.lastName} {selectedPilot?.profile.firstName}?
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  onClick={() => setShowConfirmModal(false)}
                  disabled={isSaving}
                >
                  Отмена
                </button>
                <button
                  type="button"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  onClick={saveAssessment}
                  disabled={isSaving}
                >
                  {isSaving ? 'Сохранение...' : isEditing ? 'Обновить' : 'Сохранить'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ClientAuthGuard>
  )
}
