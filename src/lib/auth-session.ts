import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { workspaces } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { cache } from 'react'

export const getSession = cache(async () => {
  return auth.api.getSession({ headers: await headers() })
})

export const getWorkspace = cache(async () => {
  const session = await getSession()
  if (!session?.user?.id) return null
  let [workspace] = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.user_id, session.user.id))
    .limit(1)

  if (!workspace) {
    const [created] = await db
      .insert(workspaces)
      .values({
        user_id: session.user.id,
        email: session.user.email,
        name: session.user.name || 'Clinical Workspace',
      })
      .returning()
    workspace = created
  }

  return workspace ?? null
})

export const isAdmin = cache(async () => {
  const session = await getSession()
  if (!session?.user) return false
  const user = session.user as { role?: string; email?: string }
  if (user.role === 'admin') return true
  const adminEmail = process.env.ADMIN_EMAIL
  if (adminEmail && user.email?.toLowerCase() === adminEmail.toLowerCase()) return true
  return false
})
