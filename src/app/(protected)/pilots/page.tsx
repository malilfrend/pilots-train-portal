'use client'

import { ClientAuthGuard } from '@/components/features/auth/ClientAuthGuard'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { CompetencyCode, COMPETENCIES } from '@/types/assessment'
import { TPilot } from '@/types/pilots'
import { INITIAL_COMPETENCY_SCORES } from '@/constants/initials-competency'
import { CreatePilotModal } from '@/components/features/instructor/CreatePilotModal'

export default function PilotsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [pilots, setPilots] = useState<TPilot[]>([])
  const [selectedPilot, setSelectedPilot] = useState<TPilot | null>(null)

  const [scores, setScores] = useState<Record<CompetencyCode, number | null>>({
    ...INITIAL_COMPETENCY_SCORES,
  })

  const [comment, setComment] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)

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
      const pilotScores: Record<CompetencyCode, number | null> = data.scores || {
        ...INITIAL_COMPETENCY_SCORES,
      }

      setScores(pilotScores)

      const hasAnyScore = Object.values(pilotScores).some((s) => s !== null)
      setIsEditing(hasAnyScore)
    } catch (error) {
      console.error('Ошибка при загрузке оценок пилота:', error)
      setErrorMessage('Не удалось загрузить оценки пилота')
    } finally {
      setIsLoading(false)
    }
  }

  const handleScoreChange = (competencyCode: CompetencyCode, value: number | null) => {
    setScores((prev) => ({
      ...prev,
      [competencyCode]: value,
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
      const competencyScores = Object.entries(scores)
        .map(([code, score]) => ({
          competencyCode: code as CompetencyCode,
          score,
        }))
        .filter((item) => item.score !== null)

      if (competencyScores.length === 0) {
        setErrorMessage('Необходимо указать хотя бы одну оценку')
        setIsSaving(false)
        return
      }

      const response = await fetch('/api/assessments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pilotId: selectedPilot.id,
          competencyScores,
          comment: comment || undefined,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Ошибка при сохранении оценок')
      }

      await fetchPilotAssessments(selectedPilot.id)
      setShowConfirmModal(false)
      alert(`Оценки успешно ${isEditing ? 'обновлены' : 'сохранены'}!`)
    } catch (error) {
      console.error('Ошибка при сохранении оценок:', error)
      setErrorMessage(
        `Ошибка при сохранении оценок: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`
      )
    } finally {
      setIsSaving(false)
    }
  }

  useEffect(() => {
    if (user && user.role !== 'INSTRUCTOR') {
      router.push('/')
    }
  }, [user, router])

  useEffect(() => {
    if (user && user.role === 'INSTRUCTOR') {
      fetchPilots()
    }
  }, [user])

  useEffect(() => {
    if (selectedPilot) {
      fetchPilotAssessments(selectedPilot.id)
    }
  }, [selectedPilot])

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
          <>
            {showCreateForm && (
              <CreatePilotModal
                onCreated={(pilot) => {
                  setPilots((prev) => [...prev, pilot])
                  setShowCreateForm(false)
                }}
                onCancel={() => setShowCreateForm(false)}
              />
            )}

            <div className="bg-white p-6 rounded-lg shadow mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Выберите пилота для оценки</h2>
                {!showCreateForm && (
                  <button
                    type="button"
                    className="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
                    onClick={() => setShowCreateForm(true)}
                  >
                    Создать пилота
                  </button>
                )}
              </div>
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
                      {pilot.profile.flightHours != null && (
                        <p className="text-sm text-gray-500">
                          Налёт: {pilot.profile.flightHours} ч
                        </p>
                      )}
                      {pilot.profile.aircraftType && (
                        <p className="text-sm text-gray-500">
                          Тип ВС: {pilot.profile.aircraftType}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">Нет доступных пилотов для оценки</p>
              )}
            </div>
          </>
        )}

        {selectedPilot && (
          <>
            {isLoading ? (
              <div className="bg-white p-6 rounded-lg shadow mb-6 flex justify-center">
                <p className="text-gray-600">Загрузка данных пилота...</p>
              </div>
            ) : (
              <>
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

                {/* Таблица "Текущие оценки" */}
                <div className="bg-white p-6 rounded-lg shadow mb-6">
                  <h3 className="text-xl font-semibold mb-4">Текущие оценки</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse border border-gray-300 mb-6">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border border-gray-300 px-4 py-2 text-center">
                            Компетенция
                          </th>
                          <th className="border border-gray-300 px-4 py-2 text-center">
                            Оценка (2-5)
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
                                  value={scores[competencyCode] ?? ''}
                                  onChange={(e) =>
                                    handleScoreChange(
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
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Введите комментарий к оценке..."
                      />
                    </div>
                  </div>
                </div>

                {/* Кнопка сохранения */}
                <div className="bg-white p-6 rounded-lg shadow mb-6">
                  <div className="flex justify-end">
                    <button
                      type="button"
                      className="px-6 py-3 bg-blue-600 text-white text-lg font-medium rounded-md hover:bg-blue-700 transition-colors"
                      onClick={handleSubmit}
                      disabled={isSaving}
                    >
                      {isSaving
                        ? 'Сохранение...'
                        : `${isEditing ? 'Обновить' : 'Сохранить'} оценки`}
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
                Вы уверены, что хотите {isEditing ? 'обновить' : 'сохранить'} оценки для пилота{' '}
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
