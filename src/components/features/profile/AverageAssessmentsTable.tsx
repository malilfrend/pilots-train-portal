import { COMPETENCIES, CompetencyCode } from '@/types/assessment'

type TProps = {
  pilotName: string
  competencyAverages: Record<CompetencyCode, number | null>
}

export const AverageAssessmentsTable = ({ pilotName, competencyAverages }: TProps) => {
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
