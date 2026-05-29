import { MongoClient } from 'mongodb'

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017'
const DB_NAME = process.env.MONGODB_DB || 'focusflow'

let cached = globalThis._mongo
if (!cached) cached = globalThis._mongo = { conn: null, promise: null }

export async function connectToDatabase() {
  if (cached.conn) return cached.conn
  if (!cached.promise) {
    const client = new MongoClient(MONGODB_URI)
    cached.promise = client.connect().then(() => client)
  }
  const client = await cached.promise
  const db = client.db(DB_NAME)
  cached.conn = { client, db }
  return cached.conn
}

export async function getDb() {
  const c = await connectToDatabase()
  return c.db
}
