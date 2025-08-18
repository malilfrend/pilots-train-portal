import { CompetencyCode } from '@prisma/client'

export type TExercise = {
  id: number
  name: string
  competencies: Array<CompetencyCode>
}
