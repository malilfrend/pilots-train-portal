import prisma from '@/lib/prisma'

export async function getSession(id: number) {
  try {
    const session = await prisma.session.findUnique({
      where: { id },
      include: {
        exercises: {
          include: {
            _count: {
              select: { comments: true },
            },
          },
        },
      },
    })
    return session
  } catch (error) {
    console.error('Error fetching session:', error)
    return null
  }
}
