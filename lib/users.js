import { getDb } from './mongo'
import { ObjectId } from 'mongodb'

export async function findUserByEmail(email) {
  const db = await getDb()
  const user = await db.collection('users').findOne({ email: email.toLowerCase() })
  if (!user) return null
  return { id: user.id, name: user.name, email: user.email, passwordHash: user.passwordHash, createdAt: user.createdAt }
}

export async function createUser({ name, email, passwordHash }) {
  const db = await getDb()
  const id = `user_${Date.now()}_${Math.random().toString(36).slice(2)}`
  const doc = { id, name, email: email.toLowerCase(), passwordHash, createdAt: new Date().toISOString() }
  await db.collection('users').insertOne(doc)
  return { id: doc.id, name: doc.name, email: doc.email }
}
