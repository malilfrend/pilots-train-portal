'use client'

import { COMPETENCIES } from '@/types/assessment'
import { TExercise } from '@/types/exercises'

type TProps = {
  exercises: TExercise[]
  onDelete?: (index: number) => void
}

export function ExerciseList({ exercises, onDelete }: TProps) {
  if (exercises.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <p className="text-gray-600 text-center">Упражнения не найдены</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {exercises.map((exercise, idx) => (
        <div
          key={`${exercise.id}-${idx}`}
          className="bg-white p-4 rounded-lg shadow border hover:shadow-md transition-shadow relative"
        >
          <div className="flex-col justify-between items-start mb-4">
            <div className="flex items-center gap-2 justify-between w-full mb-2">
              <span className="text-xs text-gray-400 font-mono">#{idx + 1}</span>
              {onDelete && (
                <button
                  type="button"
                  className="px-2 py-1 text-xs text-red-600 border border-red-300 rounded hover:bg-red-50 transition-colors self-end"
                  onClick={() => onDelete(idx)}
                >
                  Удалить
                </button>
              )}
            </div>

            <h3 className="text-lg font-semibold text-gray-900 max-w-[100%] mb-2">
              {exercise.name}
            </h3>

            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-600 font-mono">
                Duration: {exercise.executionTime ? `${exercise.executionTime} min` : '—'}
              </span>
              <span>|</span>
              <span className="text-sm text-gray-500 bg-gray-100 px-2 rounded">
                id: {exercise.id}
              </span>
              {exercise.pilot && (
                <>
                  <span>|</span>
                  <span className="inline-flex items-center gap-1 text-xs font-medium">
                    <span className="px-2 py-0.5 rounded bg-sky-100 text-sky-800 border border-sky-200">
                      Пилот {exercise.pilot}
                    </span>
                    {exercise.role && (
                      <span
                        className={
                          'px-2 py-0.5 rounded border ' +
                          (exercise.role === 'PF'
                            ? 'bg-amber-100 text-amber-800 border-amber-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200')
                        }
                      >
                        {exercise.role}
                      </span>
                    )}
                  </span>
                  {exercise.targetCompetency && (
                    <>
                      <span>|</span>
                      <span
                        className="px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800 border border-indigo-200"
                        title={COMPETENCIES[exercise.targetCompetency]?.description}
                      >
                        Цель: {exercise.targetCompetency}
                      </span>
                    </>
                  )}
                </>
              )}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Развиваемые компетенции:</h4>
            <div className="flex flex-wrap gap-2">
              {exercise.competencies.map((competencyCode) => {
                const competency = COMPETENCIES[competencyCode]
                return (
                  <span
                    key={competencyCode}
                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200"
                    title={competency?.description}
                  >
                    {competencyCode} | {competency?.name}
                  </span>
                )
              })}
            </div>
          </div>

          {exercise.step && (
            <span
              className={
                `inline-flex absolute right-1 bottom-1 items-center px-0.5 py-0.5 rounded text-xs font-medium border ` +
                (exercise.step === 'first'
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                  : 'bg-purple-100 text-purple-800 border-purple-200')
              }
            >
              {exercise.step === 'first' ? 'Этап 1' : 'Этап 2'}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}
