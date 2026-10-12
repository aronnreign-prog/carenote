import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { getSession, isAdmin } from '@/lib/auth-session'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import {
  workspaces as workspacesTable,
  patients as patientsTable,
  clinicalRecords as clinicalRecordsTable,
  demoRequests as demoRequestsTable,
} from '@/lib/db/schema'
import { eq, desc, inArray, count } from 'drizzle-orm'
import { AdminClient } from './AdminClient'

export const dynamic = 'force-dynamic'

export function computeAdminUserList(
  authUsers: Array<{
    id: string
    name: string
    email: string
    role?: string | null
    banned?: boolean | null
    banReason?: string | null
    createdAt?: Date | string
  }>,
  workspaces: Array<{ id: string; user_id: string }>,
  patientCounts: Array<{ workspace_id: string; count: number | string }>,
  recordCounts: Array<{ workspace_id: string; count: number | string }>
) {
  const workspaceByUserId = new Map(workspaces.map((w) => [w.user_id, w.id]))
  const patientCountMap = new Map(patientCounts.map((p) => [p.workspace_id, Number(p.count)]))
  const recordCountMap = new Map(recordCounts.map((r) => [r.workspace_id, Number(r.count)]))

  return authUsers.map((u) => {
    const workspaceId = workspaceByUserId.get(u.id)
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role || 'user',
      banned: Boolean(u.banned),
      banReason: u.banReason || null,
      createdAt: u.createdAt ? new Date(u.createdAt).toISOString() : new Date().toISOString(),
      patientCount: workspaceId ? (patientCountMap.get(workspaceId) || 0) : 0,
      indexedRecordCount: workspaceId ? (recordCountMap.get(workspaceId) || 0) : 0,
    }
  })
}

export default async function AdminPage() {
  const session = await getSession()
  if (!session?.user) {
    redirect('/login')
  }

  const authorized = await isAdmin()
  if (!authorized) {
    redirect('/dashboard')
  }

  // 1. Fetch users natively using Better Auth official Admin API
  // Doc: https://better-auth.com/docs/plugins/admin.md#list-users
  const reqHeaders = await headers()
  const authResponse = await auth.api.listUsers({
    query: {
      limit: 100,
    },
    headers: reqHeaders,
  })

  const authUsers = authResponse?.users || []
  const userIds = authUsers.map((u) => u.id)

  // 2. Query workspace usage stats with bounded SQL queries and aggregation
  const [workspaces, pendingRequestsRaw] = await Promise.all([
    userIds.length > 0
      ? db
          .select({
            id: workspacesTable.id,
            user_id: workspacesTable.user_id,
          })
          .from(workspacesTable)
          .where(inArray(workspacesTable.user_id, userIds))
      : Promise.resolve([]),

    db
      .select()
      .from(demoRequestsTable)
      .where(eq(demoRequestsTable.status, 'pending'))
      .orderBy(desc(demoRequestsTable.created_at))
      .limit(100),
  ])

  const workspaceIds = workspaces.map((w) => w.id)

  const [patientCounts, recordCounts] = await Promise.all([
    workspaceIds.length > 0
      ? db
          .select({
            workspace_id: patientsTable.workspace_id,
            count: count(patientsTable.id),
          })
          .from(patientsTable)
          .where(inArray(patientsTable.workspace_id, workspaceIds))
          .groupBy(patientsTable.workspace_id)
      : Promise.resolve([]),

    workspaceIds.length > 0
      ? db
          .select({
            workspace_id: clinicalRecordsTable.workspace_id,
            count: count(clinicalRecordsTable.id),
          })
          .from(clinicalRecordsTable)
          .where(inArray(clinicalRecordsTable.workspace_id, workspaceIds))
          .groupBy(clinicalRecordsTable.workspace_id)
      : Promise.resolve([]),
  ])

  const userList = computeAdminUserList(authUsers, workspaces, patientCounts, recordCounts)

  const pendingRequests = (pendingRequestsRaw || []).map((r) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    organization: r.organization || null,
    role: r.role || null,
    useCase: r.use_case || null,
    createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
  }))

  return (
    <AdminClient
      currentUserEmail={session.user.email}
      users={userList}
      pendingRequests={pendingRequests}
    />
  )
}
