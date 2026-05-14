import { CompetencyCode } from '@prisma/client'
import { TExercise } from '@/types/exercises'

export const ALL_CODES: CompetencyCode[] = ['PRO', 'COM', 'FPA', 'FPM', 'LTW', 'PSD', 'SAW', 'WLM']

export const DEFAULT_EXECUTION_TIME = 30
export const DEFAULT_TOTAL_TIME = 240
const NULL_SCORE_IMPORTANCE = 2

export type Importances = Record<CompetencyCode, number>
export type Scores = Record<CompetencyCode, number | null>

export function importanceFromScore(score: number | null): number {
  if (score == null) return NULL_SCORE_IMPORTANCE
  return 6 - score
}

export function buildImportances(scores: Scores): Importances {
  const w = {} as Importances
  for (const c of ALL_CODES) w[c] = importanceFromScore(scores[c])
  return w
}

export function pilotContribution(ex: TExercise, w: Importances | null): number {
  if (!w) return 0
  let s = 0
  for (const c of ex.competencies) s += w[c] ?? 0
  return s
}

type KnapsackItem = { id: number; t: number; v: number }

export function knapsack(
  items: KnapsackItem[],
  T: number
): { selectedIds: Set<number>; totalValue: number } {
  const N = items.length
  const dp: number[][] = Array.from({ length: N + 1 }, () => new Array<number>(T + 1).fill(0))

  for (let k = 1; k <= N; k++) {
    const { t: tk, v: vk } = items[k - 1]
    for (let t = 0; t <= T; t++) {
      if (tk > t) {
        dp[k][t] = dp[k - 1][t]
      } else {
        const skip = dp[k - 1][t]
        const take = dp[k - 1][t - tk] + vk
        dp[k][t] = take > skip ? take : skip
      }
    }
  }

  const selectedIds = new Set<number>()
  let t = T
  for (let k = N; k >= 1; k--) {
    if (dp[k][t] !== dp[k - 1][t]) {
      const item = items[k - 1]
      selectedIds.add(item.id)
      t -= item.t
    }
  }

  return { selectedIds, totalValue: dp[N][T] }
}

export function generateScenario(
  allExercises: TExercise[],
  pilot1Scores: Scores | null,
  pilot2Scores: Scores | null,
  T: number
): { exercises: TExercise[]; totalValue: number } {
  const w1 = pilot1Scores ? buildImportances(pilot1Scores) : null
  const w2 = pilot2Scores ? buildImportances(pilot2Scores) : null

  const items: KnapsackItem[] = []
  const valuesById = new Map<number, { v: number; v1: number; v2: number }>()
  for (const ex of allExercises) {
    const v1 = pilotContribution(ex, w1)
    const v2 = pilotContribution(ex, w2)
    const v = v1 + v2
    valuesById.set(ex.id, { v, v1, v2 })
    const t = ex.executionTime ?? DEFAULT_EXECUTION_TIME
    items.push({ id: ex.id, t, v })
  }

  const { selectedIds, totalValue } = knapsack(items, T)

  const exercises: TExercise[] = allExercises
    .filter((ex) => selectedIds.has(ex.id))
    .map((ex) => {
      const { v, v1, v2 } = valuesById.get(ex.id)!
      const out: TExercise = { ...ex, value: v }
      if (w1 && w2) {
        if (v1 > v2) {
          out.pilot = 1
          out.role = 'PF'
        } else if (v2 > v1) {
          out.pilot = 2
          out.role = 'PF'
        } else if (v1 > 0) {
          out.forBothPilots = true
          out.role = 'PF'
        }
      }
      return out
    })

  return { exercises, totalValue }
}
