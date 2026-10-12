import { defineConfig } from 'drizzle-kit'
import { config } from '@dotenvx/dotenvx'

config({ path: ['.env.local', '.env'], quiet: true })

export default defineConfig({
  schema: './src/lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: { url: process.env.DATABASE_URL! },
})
