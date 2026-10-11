import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import nextEnv from '@next/env'
import postgres from 'postgres'

const { loadEnvConfig } = nextEnv
loadEnvConfig(process.cwd())

const databaseUrl = process.env.POSTGRES_URL
if (!databaseUrl) {
  throw new Error('POSTGRES_URL is required to migrate the story database.')
}

const migration = await readFile(
  resolve(process.cwd(), 'db/migrations/001_story_entries.sql'),
  'utf8',
)
const sql = postgres(databaseUrl, {
  max: 1,
  prepare: false,
  connect_timeout: 15,
})

try {
  await sql.unsafe(migration)
  console.log('Story entries table is ready.')
} finally {
  await sql.end({ timeout: 5 })
}
