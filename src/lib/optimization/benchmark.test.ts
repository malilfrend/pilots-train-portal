import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { optimizeBalancedCountsPowell, evaluateOptimization, benchmarkOptimization } from './index'

// Детерминированный Math.random для стабильных тестов
const makeLCG = (seed: number) => {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 0x100000000
  }
}

let originalRandom: () => number

const withSeed = (seed: number, fn: () => void) => {
  originalRandom = Math.random
  ;(Math as any).random = makeLCG(seed)
  try {
    fn()
  } finally {
    ;(Math as any).random = originalRandom
  }
}

describe('Stage2 optimization benchmarking', () => {
  const A = [
    // K=3 (строки), M=5 (столбцы)
    [1, 0, 1, 1, 0],
    [0, 1, 1, 0, 1],
    [1, 1, 0, 0, 0],
  ]
  const s0 = [3.0, 3.7, 4.2]
  const d = 0.5
  const L = 2
  const gamma = 10
  const lambda = 2000

  it('Powell выдаёт допустимое решение и улучшает минимум и softmin', () => {
    withSeed(12345, () => {
      const { counts } = optimizeBalancedCountsPowell({ A, s0, d, L, gamma, lambda })
      const metrics = evaluateOptimization(
        A,
        s0,
        d,
        counts,
        gamma,
        Math.min(L, A[0].length),
        lambda
      )
      expect(metrics.feasible).toBe(true)
      expect(metrics.penalty).toBeLessThan(1e-6)
      expect(metrics.softminAfter).toBeGreaterThanOrEqual(metrics.softminBefore)
      expect(metrics.minAfter).toBeGreaterThanOrEqual(metrics.minBefore)
    })
  })

  it('Powell не хуже greedy и лучше случайной медианы по softmin', () => {
    withSeed(54321, () => {
      const report = benchmarkOptimization(A, s0, d, L, gamma, lambda, 200)
      expect(report.powell.softminAfter).toBeGreaterThanOrEqual(report.greedy.softminAfter - 1e-9)
      expect(report.powell.softminAfter).toBeGreaterThanOrEqual(
        report.randomMedian.softminAfter - 1e-9
      )
    })
  })

  it('Детерминистичность при фиксированном сидe', () => {
    const runOnce = () => {
      let out: number[] = []
      withSeed(111, () => {
        out = optimizeBalancedCountsPowell({ A, s0, d, L, gamma, lambda }).counts
      })
      return out
    }
    const c1 = runOnce()
    const c2 = runOnce()
    expect(c1).toEqual(c2)
  })
})
