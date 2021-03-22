import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()

process.on("exit", async () => {
  console.log("closing database ...")
  await db.$disconnect()
})
export default db

