import "server-only"
import mongoose from "mongoose"
import { env } from "./env"

type Cache = { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null }

const globalForDb = globalThis as unknown as { __mongoose?: Cache }
const cache: Cache = (globalForDb.__mongoose ??= { conn: null, promise: null })

async function resolveUri(uri: string) {
  if (uri !== "memory") return uri
  // Dev-only: spin up a throwaway MongoDB and fill it with demo data.
  const { MongoMemoryServer } = await import("mongodb-memory-server")
  const server = await MongoMemoryServer.create()
  return server.getUri("diaspora-connect")
}

/** Connects once per server process and reuses the connection (survives hot reloads in dev). */
export async function connectDB() {
  if (cache.conn) return cache.conn
  if (!cache.promise) {
    const { MONGODB_URI } = env()
    cache.promise = (async () => {
      const uri = await resolveUri(MONGODB_URI)
      const conn = await mongoose.connect(uri, { bufferCommands: false })
      if (MONGODB_URI === "memory") {
        const { seedDemoData } = await import("./seed")
        await seedDemoData()
        console.info("[db] In-memory database ready with demo data.")
      }
      return conn
    })()
  }
  try {
    cache.conn = await cache.promise
  } catch (error) {
    cache.promise = null
    throw error
  }
  return cache.conn
}
