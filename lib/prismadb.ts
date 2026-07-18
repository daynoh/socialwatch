import { PrismaClient } from "@prisma/client"

declare global{
    var prisma: PrismaClient | undefined
}

// Check if the global object already has a PrismaClient instance
const existingPrisma = globalThis.prisma as PrismaClient | undefined;

// Create a new instance only if it doesn't exist
const prismadb = existingPrisma || new PrismaClient();

// Conditionally assign the instance to the global object in non-production environments
if (process.env.NODE_ENV !== 'production' && !existingPrisma) {
  globalThis.prisma = prismadb;
}

export default prismadb;