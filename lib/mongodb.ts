import { MongoClient } from "mongodb"

const cache = globalThis as typeof globalThis & { financeMongo?: Promise<MongoClient> }

// Lazy connection keeps local mode and builds independent of database credentials.
export default async function getMongoClient() {
  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error("Configure MONGODB_URI para usar a sincronização e os avisos.")
  if (!cache.financeMongo) {
    cache.financeMongo = new MongoClient(uri, { serverSelectionTimeoutMS: 10000 }).connect().catch(error => {
      cache.financeMongo = undefined
      throw error
    })
  }
  return cache.financeMongo
}
