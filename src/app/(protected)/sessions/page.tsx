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
import { TPilotAverage } from '@/app/api/average-assessments/route'
import { AverageAssessmentsTable } from '@/components/features/profile/AverageAssessmentsTable'
import { INITIAL_COMPETENCY_SCORES } from '@/constants/initials-competency'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function SessionsPage() {
  const { user } = useAuth()
  const router = useRouter()

  const [isLoading, setIsLoading] = useState(false)

  const [pilots, setPilots] = useState<Array<TPilot>>([])
  const [pilotsError, setPilotsError] = useState('')

  const [exercises, setExercises] = useState<TExercise[] | null>(null)

  const [averageAssessments, setAverageAssessments] = useState<{
    pilot1?: TPilotAverage
    pilot2?: TPilotAverage
  } | null>(null)

  const [pilotIdsMap, setPilotIdsMap] = useState<Record<string, boolean>>({})
  const [R, setR] = useState<number>(3.5)
  const [d, setD] = useState<number>(0.1)

  const isDisabledFetchExercises = Object.values(pilotIdsMap).length < 2

  const hasPilotsAndExercises = !!exercises && pilots.length > 0

  const selectedPilotsArray = useMemo(
    () => pilots.filter((pilot) => pilotIdsMap[pilot.id]),
    [pilots, pilotIdsMap]
  )

  const handleSelectPilot = (pilotId: number) => {
    if (pilotIdsMap[pilotId]) {
      setPilotIdsMap((prev) => {
        const newMap = { ...prev }
        delete newMap[pilotId]
        return newMap
      })

      return
    }

    setPilotIdsMap((prev) => ({ ...prev, [pilotId]: true }))
  }

  const handleChooseOtherPilots = () => {
    setPilotIdsMap({})
    setExercises(null)
  }

  const fetchExercises = async () => {
    setIsLoading(true)

    const pilotIds = Object.keys(pilotIdsMap)

    try {
      const response = await fetch(
        `/api/exercises?pilot1Id=${pilotIds[0]}&pilot2Id=${pilotIds[1]}&R=${R}&d=${d}`
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
    const pilotIds = Object.keys(pilotIdsMap)

    const response = await fetch(
      `/api/average-assessments?pilot1Id=${pilotIds[0]}&pilot2Id=${pilotIds[1]}`
    )

    if (!response.ok) {
      throw new Error('Ошибка при загрузке средних оценок')
    }

    const data = await response.json()
    setAverageAssessments(data.pilots)
  }

  const handleClickOnLoadExercises = () => {
    fetchAverageAssessments()
    fetchExercises()
  }

  const handleChangeR = (e: React.ChangeEvent<HTMLInputElement>) => {
    setR(Number(e.target.value))
  }

  const handleChangeD = (e: React.ChangeEvent<HTMLInputElement>) => {
    setD(Number(e.target.value))
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
            <Button disabled={isDisabledFetchExercises} onClick={handleClickOnLoadExercises}>
              Загрузить упражнения
            </Button>
          )}

          {hasPilotsAndExercises && (
            <Button onClick={handleChooseOtherPilots}>Выбрать других пилотов</Button>
          )}

          <div className="flex items-center gap-2">
            <Label htmlFor="R">R</Label>
            <Input
              min={0}
              max={5}
              step={0.1}
              type="number"
              id="R"
              placeholder="R"
              value={R}
              onChange={handleChangeR}
            />
          </div>

          <div className="flex items-center gap-2">
            <Label htmlFor="d">d</Label>
            <Input
              type="number"
              min={0}
              step={0.1}
              max={1}
              id="d"
              placeholder="d"
              value={d}
              onChange={handleChangeD}
            />
          </div>
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
            selectedPilotIds={pilotIdsMap}
          />
        )}

        {hasPilotsAndExercises && (
          <div className="mb-6">
            <PilotsList pilots={selectedPilotsArray} selectedPilotIds={pilotIdsMap} />
          </div>
        )}

        {!!averageAssessments && hasPilotsAndExercises && (
          <AverageAssessmentsTable
            pilotName={averageAssessments.pilot1?.pilotName || ''}
            competencyAverages={
              averageAssessments.pilot1?.competencyAverages || INITIAL_COMPETENCY_SCORES
            }
          />
        )}

        {!!averageAssessments && hasPilotsAndExercises && (
          <AverageAssessmentsTable
            pilotName={averageAssessments.pilot2?.pilotName || ''}
            competencyAverages={
              averageAssessments.pilot2?.competencyAverages || INITIAL_COMPETENCY_SCORES
            }
          />
        )}

        {!!exercises && <ExerciseList exercises={exercises} />}
      </div>
    </ClientAuthGuard>
  )
}
