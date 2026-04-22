'use client'

import { ClientAuthGuard } from '@/components/features/auth/ClientAuthGuard'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { ExerciseList } from '@/components/features/instructor/ExerciseList'
import { TExercise } from '@/types/exercises'
import { TPilot } from '@/types/pilots'
import { Button } from '@/components/ui/button'
import { PilotsList } from '@/components/features/instructor/PilotsList'
import { TMinCompetencyScores, TPilotWithAssessments } from '@/app/api/average-assessments/route'
import { AverageAssessmentsTable } from '@/components/features/profile/AverageAssessmentsTable'
import { INITIAL_COMPETENCY_SCORES } from '@/constants/initials-competency'
import { AddExerciseModal } from '@/components/features/instructor/AddExerciseModal'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollToTopButton } from '@/components/ui/scroll-to-top-button'

export default function SessionsPage() {
  const { user } = useAuth()
  const router = useRouter()

  const [isLoading, setIsLoading] = useState(false)

  const [pilots, setPilots] = useState<Array<TPilot>>([])
  const [pilotsError, setPilotsError] = useState('')

  const [exercises, setExercises] = useState<TExercise[] | null>(null)

  const [showAddModal, setShowAddModal] = useState(false)

  const [duration, setDuration] = useState<string>('240')

  const [averageAssessments, setAverageAssessments] = useState<{
    pilot1?: TPilotWithAssessments
    pilot2?: TPilotWithAssessments
  } | null>(null)

  const [minCompetencyScores, setMinCompetencyScores] = useState<TMinCompetencyScores | null>(null)

  const [selectedPilotIdsMap, setSelectedPilotIdsMap] = useState<Record<string, boolean>>({})

  const isDisabledFetchExercises = Object.values(selectedPilotIdsMap).length < 2

  const hasPilotsAndExercises = !!exercises && pilots.length > 0

  const selectedPilotsArray = useMemo(
    () => pilots.filter((pilot) => selectedPilotIdsMap[pilot.id]),
    [pilots, selectedPilotIdsMap]
  )

  const handleSelectPilot = (pilotId: number) => {
    if (selectedPilotIdsMap[pilotId]) {
      setSelectedPilotIdsMap((prev) => {
        const newMap = { ...prev }
        delete newMap[pilotId]
        return newMap
      })

      return
    }

    setSelectedPilotIdsMap((prev) => ({ ...prev, [pilotId]: true }))
  }

  const handleDeleteExercise = (index: number) => {
    setExercises((prev) => (prev ? prev.filter((_, i) => i !== index) : prev))
  }

  const handleAddExercise = (exercise: TExercise) => {
    setExercises((prev) => (prev ? [...prev, exercise] : [exercise]))
    setShowAddModal(false)
  }

  const exerciseIds = useMemo(() => new Set(exercises?.map((ex) => ex.id) ?? []), [exercises])

  const totalExercisesTime = useMemo(
    () => exercises?.reduce((sum, ex) => sum + (ex.executionTime ?? 0), 0) ?? 0,
    [exercises]
  )

  const handleChooseOtherPilots = () => {
    setSelectedPilotIdsMap({})
    setExercises(null)
    setAverageAssessments(null)
    setMinCompetencyScores(null)
  }

  const fetchExercises = async () => {
    setIsLoading(true)

    const pilotIds = Object.keys(selectedPilotIdsMap)

    try {
      const response = await fetch(
        `/api/exercises?pilot1Id=${pilotIds[0]}&pilot2Id=${pilotIds[1]}&T=${Number(duration)}`
      )

      if (!response.ok) {
        throw new Error('Ошибка при загрузке упражнений')
      }

      const data = await response.json()
      setExercises(data.exercises)
    } catch (error) {
      console.error('Ошибка при загрузке упражнений:', error)
    } finally {
      setIsLoading(false)
    }
  }

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
      setPilotsError('Не удалось загрузить список пилотов')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchAverageAssessments = async () => {
    const pilotIds = Object.keys(selectedPilotIdsMap)

    const response = await fetch(
      `/api/average-assessments?pilot1Id=${pilotIds[0]}&pilot2Id=${pilotIds[1]}`
    )

    if (!response.ok) {
      throw new Error('Ошибка при загрузке средних оценок')
    }

    const data = await response.json()
    setAverageAssessments(data.pilots)
    setMinCompetencyScores(data.minCompetencyScores ?? null)
  }

  const handleClickOnLoadExercises = async () => {
    await fetchAverageAssessments()
    await fetchExercises()
  }

  const handleChangeDuration = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDuration(e.target.value)
  }

  // Дополнительная проверка, что пользователь - инструктор
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

  if (isLoading)
    return <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">Загрузка...</div>

  if (pilotsError) return <div className="text-red-500">Ошибка: {pilotsError}</div>

  return (
    <ClientAuthGuard>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Сессии</h1>
          <p className="mt-2 text-gray-600">
            Список доступных упражнений для развития компетенций пилотов
          </p>
        </div>

        <div className="mb-6 flex gap-4">
          {!hasPilotsAndExercises && (
            <div className="flex gap-4 flex-col">
              <div>
                <Label>Длительность сессии в минутах</Label>
                <Input
                  value={duration ?? '240'}
                  type="string"
                  placeholder="Введите длительность сессии (в минутах)"
                  onChange={handleChangeDuration}
                />
              </div>
              <Button disabled={isDisabledFetchExercises} onClick={handleClickOnLoadExercises}>
                Загрузить упражнения
              </Button>
            </div>
          )}

          {hasPilotsAndExercises && (
            <Button onClick={handleChooseOtherPilots}>Выбрать других пилотов</Button>
          )}
        </div>

        {!hasPilotsAndExercises && (
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-900">Выберите пилотов</h2>
          </div>
        )}

        {hasPilotsAndExercises && (
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-900">Выбранные пилоты</h2>
          </div>
        )}

        {!exercises && (
          <PilotsList
            pilots={pilots}
            onSelectPilot={handleSelectPilot}
            selectedPilotIds={selectedPilotIdsMap}
          />
        )}

        {hasPilotsAndExercises && (
          <div className="mb-6">
            <PilotsList pilots={selectedPilotsArray} selectedPilotIds={selectedPilotIdsMap} />
          </div>
        )}

        {!!averageAssessments && hasPilotsAndExercises && (
          <AverageAssessmentsTable
            tableName={averageAssessments.pilot1?.pilotName || ''}
            competencyScores={
              averageAssessments.pilot1?.competencyScores || INITIAL_COMPETENCY_SCORES
            }
          />
        )}

        {!!averageAssessments && hasPilotsAndExercises && (
          <AverageAssessmentsTable
            tableName={averageAssessments.pilot2?.pilotName || ''}
            competencyScores={
              averageAssessments.pilot2?.competencyScores || INITIAL_COMPETENCY_SCORES
            }
          />
        )}

        {!!minCompetencyScores && hasPilotsAndExercises && (
          <AverageAssessmentsTable
            tableName="Минимальная оценка по паре пилотов"
            competencyScores={minCompetencyScores}
          />
        )}

        {!!exercises && (
          <>
            <div className="mb-4 flex justify-end">
              <Button onClick={() => setShowAddModal(true)}>Добавить упражнение</Button>
            </div>
            <ExerciseList exercises={exercises} onDelete={handleDeleteExercise} />
            <div className="mt-4 text-gray-900">
              Общее время упражнений: {totalExercisesTime} из {duration} минут
            </div>
          </>
        )}

        {showAddModal && (
          <AddExerciseModal
            excludeIds={exerciseIds}
            onAdd={handleAddExercise}
            onClose={() => setShowAddModal(false)}
          />
        )}
        <ScrollToTopButton />
      </div>
    </ClientAuthGuard>
  )
}
