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
