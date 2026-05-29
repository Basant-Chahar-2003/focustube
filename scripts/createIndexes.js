const { getDb } = require('../lib/mongo')

async function run() {
  const db = await getDb()
  console.log('Creating indexes...')
  try {
    await db.collection('streaks').createIndex({ user_id: 1 }, { unique: true })
    await db.collection('stats').createIndex({ user_id: 1 }, { unique: true })
    await db.collection('videos').createIndex({ user_id: 1 })
    console.log('Indexes created')
  } catch (e) {
    console.error('Failed to create indexes', e)
    process.exit(1)
  }
  process.exit(0)
}

run()
