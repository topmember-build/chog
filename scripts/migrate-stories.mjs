import { readdir, readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import nextEnv from '@next/env'
import postgres from 'postgres'

const { loadEnvConfig } = nextEnv
loadEnvConfig(process.cwd())

const databaseUrl = process.env.POSTGRES_URL
if (!databaseUrl) {
  throw new Error('POSTGRES_URL is required to migrate the story database.')
}

const migrationsDirectory = resolve(process.cwd(), 'db/migrations')
const migrations = (await readdir(migrationsDirectory))
  .filter((file) => /^\d+.*\.sql$/.test(file))
  .sort()

if (migrations.length === 0) {
  throw new Error('No database migrations were found.')
}

const sql = postgres(databaseUrl, {
  max: 1,
  prepare: false,
  connect_timeout: 15,
})

try {
  for (const migrationFile of migrations) {
    const migration = await readFile(resolve(migrationsDirectory, migrationFile), 'utf8')
    await sql.unsafe(migration)
    console.log(`Database migration ready: ${migrationFile}`)
  }
} finally {
  await sql.end({ timeout: 5 })
}
