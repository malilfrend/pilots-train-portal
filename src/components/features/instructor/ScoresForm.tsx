'use client'

import { COMPETENCIES, CompetencyCode, TCompetencyScores } from '@/types/assessment'

type TProps = {
  title: React.ReactNode
  scores: TCompetencyScores
  onScoreChange: (code: CompetencyCode, value: number | null) => void
  comment: string
  onCommentChange: (value: string) => void
}

export function ScoresForm({ title, scores, onScoreChange, comment, onCommentChange }: TProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow mb-6">
      <h3 className="text-xl font-semibold mb-4">{title}</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse border border-gray-300 mb-6">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-4 py-2 text-center">Компетенция</th>
              <th className="border border-gray-300 px-4 py-2 text-center">Оценка (2-5)</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(COMPETENCIES).map(([code, competency]) => {
              const competencyCode = code as CompetencyCode
              return (
                <tr key={competencyCode}>
                  <td className="border border-gray-300 px-4 py-2">
                    {competencyCode} | {competency.name} | {competency.nameEn}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-center">
                    <select
                      className="border rounded p-1 w-full"
                      value={scores[competencyCode] ?? ''}
                      onChange={(e) =>
                        onScoreChange(
                          competencyCode,
                          e.target.value === '' ? null : parseInt(e.target.value)
                        )
                      }
                    >
                      <option value="">Не выбрано</option>
                      {[2, 3, 4, 5].map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        <div>
          {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
          <label className="block text-lg font-semibold text-gray-700 mb-2">
            Комментарий инструктора
          </label>
          <textarea
            className="w-full p-2 border rounded-md"
            rows={4}
            value={comment}
            onChange={(e) => onCommentChange(e.target.value)}
            placeholder="Введите комментарий к оценке..."
          />
        </div>
      </div>
    </div>
  )
}
