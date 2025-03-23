'use client'

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table'
import { Assessment, COMPETENCIES, CompetencyCode } from '@/types/assessment'

interface AssessmentTableProps {
  title: string
  assessment: Assessment | null
}

export function AssessmentTable({ title, assessment }: AssessmentTableProps) {
  const competencyCodes = Object.keys(COMPETENCIES) as CompetencyCode[]

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-center">{title}</h3>
      <Table className="border-collapse">
        <TableHeader className="bg-blue-600">
          <TableRow>
            <TableHead className="text-white px-4 py-2 font-medium">Оценка компетенций</TableHead>
            <TableHead className="text-white px-4 py-2 font-medium text-center">-</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {competencyCodes.map((code) => {
            const competency = COMPETENCIES[code]
            const score = assessment?.competencyScores.find((s) => s.competencyCode === code)?.score

            return (
              <TableRow key={code} className="border-b">
                <TableCell className="px-4 py-3">
                  {code} | {competency.name} / {competency.nameEn}
                </TableCell>
                <TableCell className="px-4 py-3 text-center">
                  {score !== undefined && score !== null ? score : '-'}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>

      {assessment?.instructorComment && (
        <div className="mt-4 p-4 bg-gray-50 rounded-md">
          <h4 className="font-medium mb-2">Комментарий инструктора:</h4>
          <p className="text-sm">{assessment.instructorComment}</p>
        </div>
      )}
    </div>
  )
}
