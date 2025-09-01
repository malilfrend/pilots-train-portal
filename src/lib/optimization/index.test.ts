import { describe, it, expect } from 'vitest'
import { optimizeBalancedCountsPowell } from './index'

describe('optimizeBalancedCountsPowell', () => {
  it('распределяет равномерно при симметрии', () => {
    // K=2 пары, M=2 упражнений, каждое покрывает свою пару
    const A = [
      [1, 0],
      [0, 1],
    ]
    const s0 = [4, 4]
    const d = 0.5
    const L = 2
    const { counts } = optimizeBalancedCountsPowell({ A, s0, d, L })
    expect(counts.reduce((a, b) => a + b, 0)).toBe(2)
    expect(counts[0]).toBe(1)
    expect(counts[1]).toBe(1)
  })

  it('тянет к слабому месту (soft-min)', () => {
    const A = [
      [1, 0],
      [0, 1],
    ]
    const s0 = [3, 4.5]
    const d = 1
    const L = 1
    const { counts } = optimizeBalancedCountsPowell({ A, s0, d, L })
    expect(counts.reduce((a, b) => a + b, 0)).toBe(1)
    expect(counts[0]).toBe(1)
    expect(counts[1]).toBe(0)
  })

  it('не допускает повторов одного упражнения (z_j ≤ 1)', () => {
    const A = [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
    ]
    const s0 = [4, 4, 4]
    const d = 0.2
    const L = 5 // больше, чем доступно
    const { counts } = optimizeBalancedCountsPowell({ A, s0, d, L })
    expect(counts.reduce((a, b) => a + b, 0)).toBe(3)
    counts.forEach((c) => expect(c).toBeLessThanOrEqual(1))
  })

  it('предпочитает упражнение, покрывающее обе пары', () => {
    // ex0 покрывает обе пары, ex1 только вторую
    const A = [
      [1, 0],
      [1, 1],
    ]
    const s0 = [4, 4]
    const d = 0.5
    const L = 1
    const { counts } = optimizeBalancedCountsPowell({ A, s0, d, L })
    expect(counts.reduce((a, b) => a + b, 0)).toBe(1)
    expect(counts[0]).toBe(1)
    expect(counts[1]).toBe(0)
  })

  it('учитывает потолок 5 баллов', () => {
    const A = [
      [1, 0],
      [0, 1],
    ]
    const s0 = [4.8, 4.8]
    const d = 0.5
    const L = 1
    const { counts } = optimizeBalancedCountsPowell({ A, s0, d, L })
    expect(counts.reduce((a, b) => a + b, 0)).toBe(1)
    counts.forEach((c) => expect(c).toBeGreaterThanOrEqual(0))
  })
})
