import { ReactNode, useState } from 'react'
import { COMPETENCIES, CompetencyCode, TCompetencyScores } from '@/types/assessment'

type TProps = {
  tableName: ReactNode
  competencyScores: TCompetencyScores
  defaultCollapsed?: boolean
}

export const AverageAssessmentsTable = ({
  tableName,
  competencyScores,
  defaultCollapsed = false,
}: TProps) => {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed)

  return (
    <div className="bg-white p-6 rounded-lg shadow mb-6">
      <button
        type="button"
        onClick={() => setIsCollapsed((prev) => !prev)}
        className="w-full flex items-center justify-between mb-4"
        aria-expanded={!isCollapsed}
      >
        <h3 className="text-xl font-semibold text-left">{tableName}</h3>
        <span
          className={`transition-transform text-gray-500 ${isCollapsed ? '' : 'rotate-180'}`}
          aria-hidden
        >
          ▼
        </span>
      </button>

      {!isCollapsed && (
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-4 py-2 text-left">Компетенция</th>
                <th className="border border-gray-300 px-4 py-2 text-center">Оценка</th>
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
                      {competencyScores[competencyCode]}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
