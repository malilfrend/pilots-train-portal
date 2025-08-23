import { TDevelopment } from '@/app/api/exercises/route'
import { COMPETENCIES, CompetencyCode } from '@/types/assessment'

type TProps = {
  pilotName: string
  competencyAverages: Record<CompetencyCode, number | null>
  development?: TDevelopment
}

export const AverageAssessmentsTable = ({ pilotName, competencyAverages, development }: TProps) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow mb-6">
      <h3 className="text-xl font-semibold mb-4">Общая таблица компетенций {pilotName}</h3>

      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-4 py-2 text-left">Компетенция</th>
              <th className="border border-gray-300 px-4 py-2 text-center">Средняя оценка</th>
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
                    {competencyAverages[competencyCode]}
                    {development?.[competencyCode] && (
                      <span className="text-xs text-green-500">
                        {' '}
                        + {development[competencyCode]}
                      </span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
