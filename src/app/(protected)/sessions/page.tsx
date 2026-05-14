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
import { ScoresForm } from '@/components/features/instructor/ScoresForm'
import { ScenarioTotals } from '@/components/features/instructor/ScenarioTotals'
import { CompetencyCode, TCompetencyScores } from '@/types/assessment'
import { INITIAL_COMPETENCY_SCORES } from '@/constants/initials-competency'
import { AddExerciseModal } from '@/components/features/instructor/AddExerciseModal'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollToTopButton } from '@/components/ui/scroll-to-top-button'

type Step = 1 | 2 | 3 | 4

const STEP_TITLES: Record<Step, string> = {
  1: 'Выбор пилотов',
  2: 'Оценки пилота 1',
  3: 'Оценки пилота 2',
  4: 'Сценарий',
}

function pilotFullName(p?: TPilot) {
  if (!p) return ''
  return `${p.profile.lastName} ${p.profile.firstName}`
}

export default function SessionsPage() {
  const { user } = useAuth()
  const router = useRouter()

  const [step, setStep] = useState<Step>(1)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const [pilots, setPilots] = useState<Array<TPilot>>([])
  const [selectedPilotIdsMap, setSelectedPilotIdsMap] = useState<Record<string, boolean>>({})

  const [pilot1Scores, setPilot1Scores] = useState<TCompetencyScores>({
    ...INITIAL_COMPETENCY_SCORES,
  })
  const [pilot2Scores, setPilot2Scores] = useState<TCompetencyScores>({
    ...INITIAL_COMPETENCY_SCORES,
  })
  const [pilot1Comment, setPilot1Comment] = useState('')
  const [pilot2Comment, setPilot2Comment] = useState('')

  const [duration, setDuration] = useState<string>('240')
  const [exercises, setExercises] = useState<TExercise[] | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const selectedPilotIds = useMemo(
    () => Object.keys(selectedPilotIdsMap).map(Number),
    [selectedPilotIdsMap]
  )
  const [pilot1Id, pilot2Id] = selectedPilotIds

  const pilot1 = useMemo(() => pilots.find((p) => p.id === pilot1Id), [pilots, pilot1Id])
  const pilot2 = useMemo(() => pilots.find((p) => p.id === pilot2Id), [pilots, pilot2Id])

  const totalExercisesTime = useMemo(
    () => exercises?.reduce((sum, ex) => sum + (ex.executionTime ?? 0), 0) ?? 0,
    [exercises]
  )
  const totalScenarioValue = useMemo(
    () => exercises?.reduce((sum, ex) => sum + (ex.value ?? 0), 0) ?? 0,
    [exercises]
  )
  const exerciseIds = useMemo(() => new Set(exercises?.map((ex) => ex.id) ?? []), [exercises])

  const hasAnyScore = (s: TCompetencyScores) => Object.values(s).some((v) => v !== null)
  const allScoresFilled = (s: TCompetencyScores) => Object.values(s).every((v) => v !== null)

  const canGoToStep2 = selectedPilotIds.length === 2
  const canGoToStep3 = hasAnyScore(pilot1Scores)
  const canGoToStep4 = hasAnyScore(pilot2Scores)

  const handleSelectPilot = (pilotId: number) => {
    setSelectedPilotIdsMap((prev) => {
      if (prev[pilotId]) {
        const next = { ...prev }
        delete next[pilotId]
        return next
      }
      if (Object.keys(prev).length >= 2) return prev
      return { ...prev, [pilotId]: true }
    })
  }

  const handlePilot1ScoreChange = (code: CompetencyCode, value: number | null) => {
    setPilot1Scores((prev) => ({ ...prev, [code]: value }))
  }
  const handlePilot2ScoreChange = (code: CompetencyCode, value: number | null) => {
    setPilot2Scores((prev) => ({ ...prev, [code]: value }))
  }

  const handleChangeDuration = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDuration(e.target.value)
  }

  const handleDeleteExercise = (index: number) => {
    setExercises((prev) => (prev ? prev.filter((_, i) => i !== index) : prev))
  }
  const handleAddExercise = (exercise: TExercise) => {
    setExercises((prev) => (prev ? [...prev, exercise] : [exercise]))
    setShowAddModal(false)
  }

  const fetchPilots = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/pilots')
      if (!response.ok) throw new Error('Ошибка при загрузке списка пилотов')
      const data = await response.json()
      setPilots(data.pilots)
    } catch (error) {
      console.error(error)
      setErrorMessage('Не удалось загрузить список пилотов')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchExercises = async () => {
    setIsLoading(true)
    setErrorMessage(null)
    try {
      const response = await fetch('/api/exercises/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pilot1Scores,
          pilot2Scores,
          T: Math.max(1, Math.floor(Number(duration) || 0)),
        }),
      })
      if (!response.ok) throw new Error('Ошибка при загрузке упражнений')
      const data = await response.json()
      setExercises(data.exercises)
    } catch (error) {
      console.error(error)
      setErrorMessage('Не удалось загрузить упражнения')
    } finally {
      setIsLoading(false)
    }
  }

  const scoresToArray = (s: TCompetencyScores, comment: string) =>
    Object.entries(s)
      .filter(([, v]) => v !== null)
      .map(([code, v]) => ({
        competencyCode: code as CompetencyCode,
        score: v as number,
        comment: comment || null,
      }))

  const handleFinishSession = async () => {
    if (!pilot1Id || !pilot2Id || !exercises) return
    if (!allScoresFilled(pilot1Scores) || !allScoresFilled(pilot2Scores)) {
      setErrorMessage('Чтобы завершить сессию, проставьте все 8 оценок каждому пилоту')
      return
    }
    setIsSaving(true)
    setErrorMessage(null)
    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pilot1Id,
          pilot2Id,
          T: Math.max(1, Math.floor(Number(duration) || 0)),
          pilot1Scores: scoresToArray(pilot1Scores, pilot1Comment),
          pilot2Scores: scoresToArray(pilot2Scores, pilot2Comment),
          exercises: exercises.map((ex) => ({
            exerciseId: ex.id,
            name: ex.name,
            executionTime: ex.executionTime ?? 30,
            value: ex.value ?? 0,
            pilot: ex.pilot ?? null,
            role: ex.role ?? null,
            forBothPilots: !!ex.forBothPilots,
          })),
          totalValue: totalScenarioValue,
        }),
      })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || 'Не удалось сохранить сессию')
      }
      const data = await response.json()
      router.push(`/sessions/${data.id}`)
    } catch (error) {
      console.error(error)
      setErrorMessage(error instanceof Error ? error.message : 'Не удалось сохранить сессию')
    } finally {
      setIsSaving(false)
    }
  }

  const goNext = async () => {
    if (step === 1 && canGoToStep2) setStep(2)
    else if (step === 2 && canGoToStep3) setStep(3)
    else if (step === 3 && canGoToStep4) setStep(4)
  }
  const goBack = () => {
    if (step === 2) setStep(1)
    else if (step === 3) setStep(2)
    else if (step === 4) setStep(3)
  }
  const jumpTo = (target: Step) => {
    if (target < step) setStep(target)
  }

  useEffect(() => {
    if (user && user.role !== 'INSTRUCTOR') router.push('/')
  }, [user, router])

  useEffect(() => {
    if (user && user.role === 'INSTRUCTOR') fetchPilots()
  }, [user])

  return (
    <ClientAuthGuard>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-28">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Сессии</h1>
          <p className="mt-2 text-gray-600">Пошаговое формирование тренажёрной сессии</p>
        </div>

        {/* Stepper */}
        <div className="mb-6 flex flex-wrap items-center gap-2">
          {([1, 2, 3, 4] as Step[]).map((s) => {
            const isActive = s === step
            const isPast = s < step
            return (
              <button
                key={s}
                type="button"
                onClick={() => jumpTo(s)}
                disabled={s > step}
                className={
                  'px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ' +
                  (isActive
                    ? 'bg-blue-600 text-white border-blue-600'
                    : isPast
                      ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 cursor-pointer'
                      : 'bg-gray-100 text-gray-500 border-gray-200 cursor-not-allowed')
                }
              >
                Шаг {s}. {STEP_TITLES[s]}
              </button>
            )
          })}
        </div>

        {errorMessage && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {errorMessage}
          </div>
        )}

        {isLoading && (
          <div className="bg-white p-4 rounded shadow mb-4 text-gray-600">Загрузка...</div>
        )}

        {step === 1 && (
          <>
            <div className="mb-6">
              <h2 className="text-lg font-bold text-gray-900">Выберите двух пилотов</h2>
            </div>
            <PilotsList
              pilots={pilots}
              onSelectPilot={handleSelectPilot}
              selectedPilotIds={selectedPilotIdsMap}
            />
          </>
        )}

        {step === 2 && pilot1 && (
          <ScoresForm
            title={
              <>
                Оценки пилота 1 — <span className="text-blue-700">{pilotFullName(pilot1)}</span>
              </>
            }
            scores={pilot1Scores}
            onScoreChange={handlePilot1ScoreChange}
            comment={pilot1Comment}
            onCommentChange={setPilot1Comment}
          />
        )}

        {step === 3 && pilot2 && (
          <ScoresForm
            title={
              <>
                Оценки пилота 2 — <span className="text-blue-700">{pilotFullName(pilot2)}</span>
              </>
            }
            scores={pilot2Scores}
            onScoreChange={handlePilot2ScoreChange}
            comment={pilot2Comment}
            onCommentChange={setPilot2Comment}
          />
        )}

        {step === 4 && (
          <>
            <div className="bg-white p-6 rounded-lg shadow mb-6 flex flex-col gap-4">
              <div>
                <Label>Длительность сессии в минутах</Label>
                <Input
                  value={duration}
                  type="text"
                  placeholder="Введите длительность (минут)"
                  onChange={handleChangeDuration}
                />
              </div>
              <div>
                <Button onClick={fetchExercises} disabled={isLoading}>
                  {exercises ? 'Пересчитать упражнения' : 'Загрузить упражнения'}
                </Button>
              </div>
            </div>

            {!!exercises && (
              <>
                {(() => {
                  const durationNum = Math.max(0, Math.floor(Number(duration) || 0))
                  const isFull = durationNum > 0 && totalExercisesTime >= durationNum
                  const addDisabledReason = isFull
                    ? `Сессия уже заполнена: ${totalExercisesTime} из ${durationNum} минут. Удалите упражнение, чтобы освободить время.`
                    : undefined
                  return (
                    <div className="mb-4 flex justify-between gap-16 items-center">
                      <ScenarioTotals
                        totalExercisesTime={totalExercisesTime}
                        duration={duration}
                        totalScenarioValue={totalScenarioValue}
                      />
                      <span title={addDisabledReason} className="inline-block">
                        <Button onClick={() => setShowAddModal(true)} disabled={isFull}>
                          Добавить упражнение
                        </Button>
                      </span>
                    </div>
                  )
                })()}
                <ExerciseList exercises={exercises} onDelete={handleDeleteExercise} />
                <ScenarioTotals
                  className="mt-4 text-gray-900"
                  totalExercisesTime={totalExercisesTime}
                  duration={duration}
                  totalScenarioValue={totalScenarioValue}
                />
              </>
            )}
          </>
        )}

        {showAddModal && (
          <AddExerciseModal
            excludeIds={exerciseIds}
            onAdd={handleAddExercise}
            onClose={() => setShowAddModal(false)}
          />
        )}
        <ScrollToTopButton bottomOffset={72} />
      </div>

      {/* Sticky wizard navigation */}
      <div className="fixed inset-x-0 bottom-0 z-40 bg-white border-t border-gray-200 shadow-[0_-2px_8px_rgba(0,0,0,0.06)]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between">
          <Button onClick={goBack} disabled={step === 1}>
            Назад
          </Button>
          {step < 4 && (
            <Button
              onClick={goNext}
              disabled={
                (step === 1 && !canGoToStep2) ||
                (step === 2 && !canGoToStep3) ||
                (step === 3 && !canGoToStep4)
              }
            >
              Далее
            </Button>
          )}
          {step === 4 && exercises && (
            <Button
              onClick={handleFinishSession}
              disabled={isSaving}
              className="bg-green-600 text-white hover:bg-green-700 focus-visible:ring-green-500"
            >
              {isSaving ? 'Сохранение...' : 'Завершить сессию'}
            </Button>
          )}
          {step === 4 && !exercises && <span />}
        </div>
      </div>
    </ClientAuthGuard>
  )
}
