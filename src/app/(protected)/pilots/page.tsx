'use client'

import { ClientAuthGuard } from '@/components/features/auth/ClientAuthGuard'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { TPilot } from '@/types/pilots'
import { CreatePilotModal } from '@/components/features/instructor/CreatePilotModal'

type SessionListItem = {
  id: number
  date: string
  totalTime: number
  totalValue: number
  instructor: { firstName: string; lastName: string }
  partner: { id: number; firstName: string; lastName: string }
}

export default function PilotsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [pilots, setPilots] = useState<TPilot[]>([])
  const [selectedPilot, setSelectedPilot] = useState<TPilot | null>(null)
  const [sessions, setSessions] = useState<SessionListItem[] | null>(null)
  const [isLoadingPilots, setIsLoadingPilots] = useState(true)
  const [isLoadingSessions, setIsLoadingSessions] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)

  const fetchPilots = async () => {
    setIsLoadingPilots(true)
    try {
      const response = await fetch('/api/pilots')
      if (!response.ok) throw new Error('Ошибка при загрузке списка пилотов')
      const data = await response.json()
      setPilots(data.pilots)
    } catch (error) {
      console.error(error)
      setErrorMessage('Не удалось загрузить список пилотов')
    } finally {
      setIsLoadingPilots(false)
    }
  }

  const fetchSessions = async (pilotId: number) => {
    setIsLoadingSessions(true)
    setSessions(null)
    try {
      const response = await fetch(`/api/sessions?pilotId=${pilotId}`)
      if (!response.ok) throw new Error('Ошибка при загрузке истории сессий')
      const data = await response.json()
      setSessions(data.sessions)
    } catch (error) {
      console.error(error)
      setErrorMessage('Не удалось загрузить историю сессий')
    } finally {
      setIsLoadingSessions(false)
    }
  }

  useEffect(() => {
    if (user && user.role !== 'INSTRUCTOR') router.push('/')
  }, [user, router])

  useEffect(() => {
    if (user && user.role === 'INSTRUCTOR') fetchPilots()
  }, [user])

  useEffect(() => {
    if (selectedPilot) fetchSessions(selectedPilot.id)
  }, [selectedPilot])

  return (
    <ClientAuthGuard>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold mb-6">Пилоты — история сессий</h1>

        {errorMessage && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {errorMessage}
          </div>
        )}

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
            <h2 className="text-lg font-semibold">Выберите пилота</h2>
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

          {isLoadingPilots ? (
            <p className="text-gray-600">Загрузка списка пилотов...</p>
          ) : pilots.length > 0 ? (
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
                    if (e.key === 'Enter' || e.key === ' ') setSelectedPilot(pilot)
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
            <p className="text-gray-600">Нет доступных пилотов</p>
          )}
        </div>

        {selectedPilot && (
          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <h2 className="text-lg font-semibold mb-4">
              История сессий: {selectedPilot.profile.lastName} {selectedPilot.profile.firstName}
            </h2>

            {isLoadingSessions ? (
              <p className="text-gray-600">Загрузка истории...</p>
            ) : !sessions || sessions.length === 0 ? (
              <p className="text-gray-600">У пилота пока нет завершённых сессий.</p>
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
                        <td className="border border-gray-300 px-4 py-2 text-center">
                          {s.totalTime}
                        </td>
                        <td className="border border-gray-300 px-4 py-2 text-center">
                          {s.totalValue}
                        </td>
                        <td className="border border-gray-300 px-4 py-2 text-center">
                          <Link
                            href={`/sessions/${s.id}`}
                            className="text-blue-600 hover:underline"
                          >
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
        )}
      </div>
    </ClientAuthGuard>
  )
}
