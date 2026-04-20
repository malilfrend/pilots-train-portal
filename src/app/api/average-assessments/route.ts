import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { COMPETENCIES_CODES, CompetencyCode } from '@/types/assessment'
import { getPilotAssessments } from '@/lib/assessments'

export type TPilotWithAssessments = {
  pilotId: number
  pilotName: string
  competencyScores: Record<CompetencyCode, number | null>
}

export type TMinCompetencyScores = Record<CompetencyCode, number | null>

type Response = {
  pilots?: {
    pilot1?: TPilotWithAssessments
    pilot2?: TPilotWithAssessments
  }
  minCompetencyScores?: TMinCompetencyScores
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const pilot1Id = searchParams.get('pilot1Id')
    const pilot2Id = searchParams.get('pilot2Id')

    if (pilot1Id && isNaN(Number(pilot1Id))) {
      return NextResponse.json({ error: 'Неверный формат pilot1Id' }, { status: 400 })
    }

    if (pilot2Id && isNaN(Number(pilot2Id))) {
      return NextResponse.json({ error: 'Неверный формат pilot2Id' }, { status: 400 })
    }

    const pilots: { pilot1?: TPilotWithAssessments; pilot2?: TPilotWithAssessments } = {}

    if (pilot1Id) {
      try {
        const pilot1Data = await prisma.pilot.findUnique({
          where: { id: Number(pilot1Id) },
          include: {
            profile: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        })
        const pilot1Scores = await getPilotAssessments(Number(pilot1Id))

        pilots.pilot1 = {
          pilotId: Number(pilot1Id),
          pilotName: `${pilot1Data?.profile.lastName} ${pilot1Data?.profile.firstName}`,
          competencyScores: pilot1Scores,
        }
      } catch {
        return NextResponse.json({ error: 'Пилот 1 не найден' }, { status: 404 })
      }
    }

    if (pilot2Id) {
      try {
        const pilot2Data = await prisma.pilot.findUnique({
          where: { id: Number(pilot2Id) },
          include: {
            profile: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        })
        const pilot2Scores = await getPilotAssessments(Number(pilot2Id))

        pilots.pilot2 = {
          pilotId: Number(pilot2Id),
          pilotName: `${pilot2Data?.profile.lastName} ${pilot2Data?.profile.firstName}`,
          competencyScores: pilot2Scores,
        }
      } catch {
        return NextResponse.json({ error: 'Пилот 2 не найден' }, { status: 404 })
      }
    }

    let minCompetencyScores: TMinCompetencyScores | undefined
    if (pilots.pilot1 && pilots.pilot2) {
      const scores1 = pilots.pilot1.competencyScores
      const scores2 = pilots.pilot2.competencyScores
      minCompetencyScores = COMPETENCIES_CODES.reduce((acc, code) => {
        const s1 = scores1[code]
        const s2 = scores2[code]
        if (s1 == null && s2 == null) acc[code] = null
        else if (s1 == null) acc[code] = s2
        else if (s2 == null) acc[code] = s1
        else acc[code] = Math.min(s1, s2)
        return acc
      }, {} as TMinCompetencyScores)
    }

    const response: Response = {
      ...(Object.keys(pilots).length > 0 && { pilots }),
      ...(minCompetencyScores && { minCompetencyScores }),
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching assessments:', error)
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}
