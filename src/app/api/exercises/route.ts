import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { TExercise } from '@/types/exercises'
import { AssessmentSourceType, CompetencyCode } from '@prisma/client'

type Response = { exercises: Array<TExercise> }

const ALL_CODES: CompetencyCode[] = ['PRO', 'COM', 'FPA', 'FPM', 'LTW', 'PSD', 'SAW', 'WLM']

const DEFAULT_WEIGHTS: Record<AssessmentSourceType, number> = {
  PC: 0.35,
  FDM: 0.15,
  EVAL: 0.3,
  ASR: 0.2,
}

async function loadWeights(): Promise<
  Record<CompetencyCode, Record<AssessmentSourceType, number>>
> {
  const rows = await prisma.competencyWeight.findMany()
  const map: Record<CompetencyCode, Record<AssessmentSourceType, number>> = {} as any
  for (const c of ALL_CODES) map[c] = { ...DEFAULT_WEIGHTS }
  for (const r of rows) {
    if (!map[r.competencyCode]) map[r.competencyCode] = { ...DEFAULT_WEIGHTS }
    map[r.competencyCode][r.sourceType] = r.weight
  }
  return map
}

async function getPilotAverages(
  pilotId: number,
  weights: Record<CompetencyCode, Record<AssessmentSourceType, number>>
): Promise<Record<CompetencyCode, number | null>> {
  const rows = await prisma.pilotCompetencyScore.findMany({
    where: { pilotId },
    select: { competencyCode: true, sourceType: true, score: true },
  })

  const byCode: Record<CompetencyCode, Partial<Record<AssessmentSourceType, number>>> = {} as any
  for (const r of rows) {
    if (!byCode[r.competencyCode]) byCode[r.competencyCode] = {}
    byCode[r.competencyCode][r.sourceType] = r.score
  }

  const avg: Record<CompetencyCode, number | null> = {} as any
  for (const code of ALL_CODES) {
    const w = weights[code] || DEFAULT_WEIGHTS
    let sum = 0,
      sumW = 0
    ;(['PC', 'FDM', 'EVAL', 'ASR'] as AssessmentSourceType[]).forEach((st) => {
      const val = byCode[code]?.[st]
      const ww = w[st] ?? DEFAULT_WEIGHTS[st]
      if (typeof val === 'number') {
        sum += val * ww
        sumW += ww
      }
    })
    avg[code] = sumW > 0 ? Math.round((sum / sumW) * 100) / 100 : null
  }
  return avg
}

type PairKey = string // `${pilotIndex}:${code}`
const pair = (p: number, c: CompetencyCode): PairKey => `${p}:${c}`

function expectedGainForExercise(
  exCodes: CompetencyCode[],
  deficits: Map<PairKey, number>,
  d: number
): number {
  let total = 0
  for (const [k, val] of deficits) {
    if (val <= 0) continue
    const code = k.split(':')[1] as CompetencyCode
    if (exCodes.includes(code)) total += Math.min(val, d)
  }
  return Math.round(total * 1000) / 1000
}

function applyExercise(exCodes: CompetencyCode[], deficits: Map<PairKey, number>, d: number) {
  for (const [k, val] of deficits) {
    if (val <= 0) continue
    const code = k.split(':')[1] as CompetencyCode
    if (exCodes.includes(code)) deficits.set(k, Math.max(0, Math.round((val - d) * 1000) / 1000))
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const pilot1Id = searchParams.get('pilot1Id')
    const pilot2Id = searchParams.get('pilot2Id')
    const limit = Math.max(1, Number(searchParams.get('limit') ?? '24'))
    const R = Number(searchParams.get('r') ?? '3.5')
    const d = Number(searchParams.get('d') ?? '0.1')

    if (pilot1Id && isNaN(Number(pilot1Id))) {
      return NextResponse.json({ error: 'Неверный формат pilot1Id' }, { status: 400 })
    }
    if (pilot2Id && isNaN(Number(pilot2Id))) {
      return NextResponse.json({ error: 'Неверный формат pilot2Id' }, { status: 400 })
    }

    const dbExercises = await prisma.exercise.findMany({
      include: { competencies: true },
      orderBy: { name: 'asc' },
    })

    const allExercises: TExercise[] = dbExercises.map((e) => ({
      id: e.id,
      name: e.name,
      competencies: e.competencies.map((c) => c.competencyCode as CompetencyCode),
    }))

    // Нет пилотов — отдаём как есть
    if (!pilot1Id && !pilot2Id) {
      return NextResponse.json({ exercises: allExercises } as Response)
    }

    const weights = await loadWeights()

    // Считаем дефициты по парам (pilot, code)
    const deficits = new Map<PairKey, number>()

    const pilots: Array<number> = []

    if (pilot1Id) pilots.push(Number(pilot1Id))
    if (pilot2Id) pilots.push(Number(pilot2Id))

    for (let p = 0; p < pilots.length; p++) {
      const avg = await getPilotAverages(pilots[p], weights)
      for (const code of ALL_CODES) {
        const v = avg[code]
        deficits.set(pair(p, code), Math.max(0, R - (v ?? R)))
      }
    }

    // Итеративный отбор на limit слотов
    const selected: TExercise[] = []
    const used = new Set<number>()

    while (selected.length < limit) {
      // L — пары с дефицитом > 0
      const L = [...deficits.entries()].filter(([, val]) => val > 0)
      if (L.length === 0) break

      // Vmin и Lmin
      const vmin = Math.min(...L.map(([, val]) => val))
      const Lmin = L.filter(([, val]) => val === vmin).map(([k]) => k)
      const Lcodes = new Set(L.map(([k]) => k.split(':')[1] as CompetencyCode))
      const LminCodes = new Set(Lmin.map((k) => k.split(':')[1] as CompetencyCode))

      // Uimp: упражнение содержит любую из Lmin и одновременно хотя бы одну из L (другую или ту же)
      const Uimp = allExercises.filter(
        (ex) =>
          !used.has(ex.id) &&
          ex.competencies.some((c) => LminCodes.has(c)) &&
          ex.competencies.some((c) => Lcodes.has(c))
      )

      const rank = (ex: TExercise) => {
        const imp = expectedGainForExercise(ex.competencies, deficits, d)
        return {
          imp,
          cover: ex.competencies.reduce((acc, c) => acc + (Lcodes.has(c) ? 1 : 0), 0),
        }
      }

      let candidate: TExercise | null = null
      let best = { imp: 0, cover: 0 }

      const tryPick = (pool: TExercise[]) => {
        for (const ex of pool) {
          const r = rank(ex)

          if (
            r.imp > best.imp ||
            (r.imp === best.imp && r.cover > best.cover) ||
            (r.imp === best.imp &&
              r.cover === best.cover &&
              (candidate === null || ex.name.localeCompare(candidate.name, 'ru') < 0))
          ) {
            candidate = ex
            best = r
          }
        }
      }

      if (Uimp.length > 0) {
        tryPick(Uimp)
      } else {
        // Uti для любой пары из Lmin
        const LminSet = new Set<CompetencyCode>([...LminCodes])
        const Uti = allExercises.filter(
          (ex) => !used.has(ex.id) && ex.competencies.some((c) => LminSet.has(c))
        )
        if (Uti.length > 0) tryPick(Uti)
        else tryPick(allExercises.filter((ex) => !used.has(ex.id))) // запасной вариант
      }

      if (!candidate) break
      if (best.imp <= 0) break

      selected.push(candidate)
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error - candidate.id is not typed
      used.add(candidate.id)
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error - candidate.competencies is not typed
      applyExercise(candidate.competencies, deficits, d)
    }

    // Добор до лимита (если остались места)
    if (selected.length < limit) {
      for (const ex of allExercises) {
        if (selected.length >= limit) break
        if (!used.has(ex.id)) selected.push(ex)
      }
    }

    return NextResponse.json({ exercises: selected } as Response)
  } catch (error) {
    console.error('Error fetching exercises:', error)
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}
