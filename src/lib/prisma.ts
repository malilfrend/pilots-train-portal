/* eslint-disable no-var */
import { PrismaClient } from '@prisma/client'

declare global {
  var prisma: PrismaClient | undefined
}

const prismaClientSingleton = () => {
  return new PrismaClient().$extends({})
}

const prisma = globalThis.prisma ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  globalThis.prisma = prisma
}
