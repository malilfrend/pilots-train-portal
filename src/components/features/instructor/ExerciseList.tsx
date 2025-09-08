'use client'

import { COMPETENCIES } from '@/types/assessment'
import { TExercise } from '@/types/exercises'

type TProps = {
  exercises: TExercise[]
}

export function ExerciseList({ exercises }: TProps) {
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
          key={exercise.id}
          className="bg-white p-6 rounded-lg shadow border hover:shadow-md transition-shadow relative"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 font-mono">#{idx + 1}</span>
              <h3 className="text-lg font-semibold text-gray-900">{exercise.name}</h3>
            </div>
            <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
              ID:{' '}
              {exercise.id}
            </span>
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
              {exercise.step === 'first' ? 'Этап 1' : 'Этап 2'}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}
