/* eslint-disable no-var */
import { PrismaClient } from '@prisma/client'

declare global {
  var prisma: PrismaClient | undefined
}

const prismaClientSingleton = () => {
  const config = {
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  }

  if (process.env.NODE_ENV === 'production') {
    Object.assign(config, {
      __internal: {
        engine: {
          cwd: process.cwd(),
          binaryPath: undefined,
          connectionString: process.env.DATABASE_URL,
          enableDebugLogs: false,
          allowTriggerPanic: false,
        },
      },
    })
  }

  return new PrismaClient(config)
}

const prisma = globalThis.prisma ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma
}
