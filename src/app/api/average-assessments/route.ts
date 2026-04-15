import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { CompetencyCode } from '@/types/assessment'

export type TPilotAverage = {
  pilotId: number
  pilotName: string
  competencyAverages: Record<CompetencyCode, number | null>
}

type Response = {
  pilots?: {
    pilot1?: TPilotAverage
    pilot2?: TPilotAverage
  }
}

const ALL_CODES: CompetencyCode[] = ['PRO', 'COM', 'FPA', 'FPM', 'LTW', 'PSD', 'SAW', 'WLM']

async function getPilotAverages(pilotId: number): Promise<TPilotAverage> {
  const pilot = await prisma.pilot.findUnique({
    where: { id: pilotId },
    include: {
      profile: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
  })

  if (!pilot) {
    throw new Error(`Пилот с id ${pilotId} не найден`)
  }

  const scores = await prisma.pilotCompetencyScore.findMany({
    where: { pilotId },
    select: {
      competencyCode: true,
      score: true,
    },
  })

  const competencyAverages = {} as Record<CompetencyCode, number | null>

  for (const code of ALL_CODES) {
    const found = scores.find((s) => s.competencyCode === code)
    competencyAverages[code] = found ? found.score : null
  }

  return {
    pilotId,
    pilotName: `${pilot.profile.lastName} ${pilot.profile.firstName}`,
    competencyAverages,
  }
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

    const pilots: { pilot1?: TPilotAverage; pilot2?: TPilotAverage } = {}

    if (pilot1Id) {
      try {
        pilots.pilot1 = await getPilotAverages(Number(pilot1Id))
      } catch {
        return NextResponse.json({ error: 'Пилот 1 не найден' }, { status: 404 })
      }
    }

    if (pilot2Id) {
      try {
        pilots.pilot2 = await getPilotAverages(Number(pilot2Id))
      } catch {
        return NextResponse.json({ error: 'Пилот 2 не найден' }, { status: 404 })
      }
    }

    const response: Response = {
      ...(Object.keys(pilots).length > 0 && { pilots }),
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching assessments:', error)
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}
