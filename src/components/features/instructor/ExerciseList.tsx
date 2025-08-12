'use client'

import { CompetencyCode, COMPETENCIES } from '@/types/assessment'

interface Exercise {
  id: number
  name: string
  competencies: CompetencyCode[]
}

type TProps = {
  exercises: Exercise[]
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
      {exercises.map((exercise) => (
        <div
          key={exercise.id}
          className="bg-white p-6 rounded-lg shadow border hover:shadow-md transition-shadow"
        >
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-semibold text-gray-900">{exercise.name}</h3>
            <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
              ID: {exercise.id}
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
        </div>
      ))}
    </div>
  )
}
