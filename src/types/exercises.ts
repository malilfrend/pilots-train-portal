import { CompetencyCode } from '@prisma/client'

export type TExercise = {
  id: number
  name: string
  executionTime?: number | null
  competencies: Array<CompetencyCode>
  value?: number
  forBothPilots?: boolean
  step?: 'first' | 'second'
  pilot?: 1 | 2
  role?: 'PF' | 'PM'
  targetCompetency?: CompetencyCode
}
