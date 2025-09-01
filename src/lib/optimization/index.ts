import { minimize_Powell } from 'optimization-js'

type OptimizeParams = {
  // K x M: 1 если упражнение j развивает пару k (pilot, competency), иначе 0
  A: number[][]
  // длины K: текущие оценки (после Этапа 1), 0..5
  s0: number[]
  // приращение за одно выполнение упражнения
  d: number
  // сколько повторений нужно распределить
  L: number
  // параметры сглаживания/штрафов
  gamma?: number
  lambda?: number
}

type OptimizeResult = {
  counts: number[] // округлённые целые повторения по упражнениям
  value: number
  iterations: number
}

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x)

const softMin = (vals: number[], gamma: number) => {
  // численно устойчивый soft-min
  const m = Math.min(...vals)
  let sum = 0
  for (const v of vals) sum += Math.exp(-gamma * (v - m))
  return m - Math.log(sum) / gamma
}

const roundToSum = (xs: number[], targetSum: number) => {
  // банковское округление с сохранением суммы
  const flo = xs.map((v) => Math.max(0, Math.floor(v)))
  let diff = targetSum - flo.reduce((a, b) => a + b, 0)
  if (diff <= 0) {
    // снимем из самых больших хвостов
    const idx = xs
      .map((v, i) => ({ i, v }))
      .sort((a, b) => b.v - a.v || a.i - b.i)
      .map((x) => x.i)
    for (const i of idx) {
      if (diff === 0) break
      if (flo[i] > 0) {
        flo[i] -= 1
        diff += 1
      }
    }
    return flo
  }
  // добавим к наибольшим дробным частям
  const parts = xs
    .map((v, i) => ({ i, frac: v - Math.floor(v) }))
    .sort((a, b) => b.frac - a.frac || a.i - b.i)
  for (let k = 0; k < parts.length && diff > 0; k++) {
    flo[parts[k].i] += 1
    diff -= 1
  }
  return flo
}

export function optimizeBalancedCountsPowell(params: OptimizeParams): OptimizeResult {
  const { A, s0, d, L, gamma = 10 } = params
  const K = s0.length
  const M = A[0]?.length ?? 0
  if (M === 0 || K === 0 || L <= 0) {
    return { counts: Array(M).fill(0), value: 0, iterations: 0 }
  }
  // нельзя выбрать больше упражнений, чем осталось и чем доступно
  const Lcap = Math.min(L, M)

  const projectToCappedSimplex = (y: number[], sumTarget: number): number[] => {
    const clipSum = (t: number) => y.reduce((acc, v) => acc + clamp01(v - t), 0)
    let lo = -1e6
    let hi = 1e6
    for (let it = 0; it < 60; it++) {
      const mid = (lo + hi) / 2
      const s = clipSum(mid)
      if (s > sumTarget) {
        lo = mid
      } else {
        hi = mid
      }
    }
    const t = (lo + hi) / 2
    return y.map((v) => clamp01(v - t))
  }

  const objective = (y: number[]) => {
    const z = projectToCappedSimplex(y, Lcap)

    const s: number[] = new Array(K).fill(0)
    for (let k = 0; k < K; k++) {
      let incr = 0
      for (let j = 0; j < M; j++) if (A[k][j] > 0) incr += d * z[j]
      s[k] = Math.min(5, s0[k] + incr)
    }

    return -softMin(s, gamma)
  }

  const x0 = Array(M).fill(Lcap / M)
  const res = minimize_Powell(objective, x0)

  const z = projectToCappedSimplex(res.argument, Lcap)
  const counts = roundToSum(z, Lcap)

  return { counts, value: res.fncvalue, iterations: 0 }
}

// ===== Оценка и бенчмаркинг решений этапа 2 =====

export type OptimizationMetrics = {
  feasible: boolean
  sumZ: number
  penalty: number
  softminBefore: number
  softminAfter: number
  minBefore: number
  minAfter: number
  objective: number
}

const computeSoftMin = (vals: number[], gamma: number) => softMin(vals, gamma)

export function evaluateOptimization(
  A: number[][],
  s0: number[],
  d: number,
  zOrCounts: number[],
  gamma: number,
  Lcap: number,
  lambda: number
): OptimizationMetrics {
  const K = s0.length
  const M = A[0]?.length ?? 0
  const z = zOrCounts
  const sumZ = z.reduce((a, b) => a + b, 0)
  let penalty = lambda * Math.pow(sumZ - Lcap, 2)
  for (let j = 0; j < M; j++) {
    if (z[j] < 0) penalty += lambda * z[j] * z[j]
    if (z[j] > 1) {
      const over = z[j] - 1
      penalty += lambda * over * over
    }
  }

  const sAfter: number[] = new Array(K).fill(0)
  for (let k = 0; k < K; k++) {
    let incr = 0
    for (let j = 0; j < M; j++) if (A[k][j] > 0) incr += d * z[j]
    sAfter[k] = Math.min(5, s0[k] + incr)
  }

  const sBefore = s0
  const softminBefore = computeSoftMin(sBefore, gamma)
  const softminAfter = computeSoftMin(sAfter, gamma)
  const objective = -softminAfter + penalty

  return {
    feasible: z.every((v) => v >= -1e-9 && v <= 1 + 1e-9) && Math.abs(sumZ - Lcap) < 1e-6,
    sumZ,
    penalty,
    softminBefore,
    softminAfter,
    minBefore: Math.min(...sBefore),
    minAfter: Math.min(...sAfter),
    objective,
  }
}

function sampleRandomCounts(M: number, Lcap: number): number[] {
  const idxs = Array.from({ length: M }, (_, i) => i)
  // Фишер-Йетс
  for (let i = M - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[idxs[i], idxs[j]] = [idxs[j], idxs[i]]
  }
  const counts = Array(M).fill(0)
  for (let t = 0; t < Math.min(Lcap, M); t++) counts[idxs[t]] = 1
  return counts
}

function greedySoftminCounts(
  A: number[][],
  s0: number[],
  d: number,
  Lcap: number,
  gamma: number
): number[] {
  const K = s0.length
  const M = A[0]?.length ?? 0
  const chosen = new Set<number>()
  const counts = Array(M).fill(0)
  const current = s0.slice()
  const soft = (s: number[]) => computeSoftMin(s, gamma)
  for (let t = 0; t < Math.min(Lcap, M); t++) {
    let bestJ = -1
    let bestVal = -Infinity
    for (let j = 0; j < M; j++) {
      if (chosen.has(j)) continue
      const sTmp: number[] = new Array(K)
      for (let k = 0; k < K; k++) {
        sTmp[k] = Math.min(5, current[k] + (A[k][j] > 0 ? d : 0))
      }
      const val = soft(sTmp)
      if (val > bestVal || (val === bestVal && (bestJ === -1 || j < bestJ))) {
        bestVal = val
        bestJ = j
      }
    }
    if (bestJ === -1) break
    chosen.add(bestJ)
    counts[bestJ] = 1
    for (let k = 0; k < K; k++) current[k] = Math.min(5, current[k] + (A[k][bestJ] > 0 ? d : 0))
  }
  return counts
}

export type BenchmarkReport = {
  powell: OptimizationMetrics
  greedy: OptimizationMetrics
  randomBest: OptimizationMetrics
  randomMedian: OptimizationMetrics
}

export function benchmarkOptimization(
  A: number[][],
  s0: number[],
  d: number,
  L: number,
  gamma = 10,
  lambda = 2000,
  randomTrials = 1000
): BenchmarkReport {
  const M = A[0]?.length ?? 0
  const Lcap = Math.min(L, M)

  const { counts } = optimizeBalancedCountsPowell({ A, s0, d, L: Lcap, gamma, lambda })
  const powell = evaluateOptimization(A, s0, d, counts, gamma, Lcap, lambda)

  const greedyCounts = greedySoftminCounts(A, s0, d, Lcap, gamma)
  const greedy = evaluateOptimization(A, s0, d, greedyCounts, gamma, Lcap, lambda)

  // random trials
  const metrics: OptimizationMetrics[] = []
  for (let t = 0; t < Math.max(1, randomTrials); t++) {
    const rnd = sampleRandomCounts(M, Lcap)
    metrics.push(evaluateOptimization(A, s0, d, rnd, gamma, Lcap, lambda))
  }
  metrics.sort((a, b) => a.objective - b.objective)
  const randomBest = metrics[0]
  const randomMedian = metrics[Math.floor(metrics.length / 2)]

  return { powell, greedy, randomBest, randomMedian }
}
