import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { chromium, type Browser, type BrowserContext } from 'playwright'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import {
  clinicalRecords,
  clinicalSyntheses,
  demoRequests,
  patients,
  user,
  workspaces,
} from '@/lib/db/schema'
import { auth } from '@/lib/auth'
import { indexClinicalRecordFacts, purgePatientGraphMemory } from '@/lib/zep/ingest'

const LIVE_BASE_URL = (process.env.E2E_BASE_URL || 'https://carenote.in').replace(/\/+$/, '')

describe(`CareNote Live Production Chromium E2E Suite (${LIVE_BASE_URL})`, () => {
  let browser: Browser | null = null

  const runSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
  const testDemoEmail = `demo-live-e2e-${runSuffix}@carenote.test`
  const testClinicianEmail = `clinician-live-e2e-${runSuffix}@carenote.test`
  const testClinicianPassword = `CareNote!LiveE2E#${runSuffix}`

  let createdUserId: string | null = null
  let createdWorkspaceId: string | null = null
  let createdPatientId: string | null = null

  beforeAll(async () => {
    browser = await chromium.launch({ headless: true })
  }, 60000)

  afterAll(async () => {
    if (browser) {
      await browser.close()
    }

    if (createdWorkspaceId && createdPatientId) {
      await purgePatientGraphMemory(createdWorkspaceId, createdPatientId).catch(() => null)
    }

    // Clean up all E2E test rows from live Neon Postgres
    try {
      await db.delete(demoRequests).where(eq(demoRequests.email, testDemoEmail))
    } catch {
      // ignore cleanup error
    }

    if (createdWorkspaceId) {
      try {
        await db.delete(clinicalSyntheses).where(eq(clinicalSyntheses.workspace_id, createdWorkspaceId))
        await db.delete(clinicalRecords).where(eq(clinicalRecords.workspace_id, createdWorkspaceId))
        await db.delete(patients).where(eq(patients.workspace_id, createdWorkspaceId))
        await db.delete(workspaces).where(eq(workspaces.id, createdWorkspaceId))
      } catch {
        // ignore cleanup error
      }
    }

    if (createdUserId) {
      try {
        await db.delete(user).where(eq(user.id, createdUserId))
      } catch {
        // ignore cleanup error
      }
    }
  }, 60000)

  it('opens the live deployed site (https://carenote.in/#demo) in Chromium, submits a Demo Request, and verifies persistence in Neon Postgres', async () => {
    const context: BrowserContext = await browser!.newContext()
    const page = await context.newPage()

    try {
      const response = await page.goto(`${LIVE_BASE_URL}/#demo`, {
        waitUntil: 'load',
        timeout: 45000,
      })
      expect(response?.status()).toBe(200)

      const dialog = page.getByRole('dialog', { name: 'Request Demo Access' })
      await dialog.waitFor({ state: 'visible', timeout: 20000 })

      await dialog.locator('#demo-name').fill('Dr. Priya Nair')
      await dialog.locator('#demo-email').fill(testDemoEmail)
      await dialog.locator('#demo-role').fill('Cardiologist')
      await dialog.locator('#demo-organization').fill('Metro Heart Center')
      await dialog
        .locator('#demo-usecase')
        .fill('Longitudinal heart failure reconciliation across 4 hospitals')

      await dialog.getByRole('button', { name: 'Request Demo Access' }).click()

      await page
        .getByText('Demo Access Request Received')
        .waitFor({ state: 'visible', timeout: 20000 })

      // Verify row was written by the live Vercel deployment into Neon Postgres
      const rows = await db
        .select()
        .from(demoRequests)
        .where(eq(demoRequests.email, testDemoEmail))

      expect(rows.length).toBe(1)
      expect(rows[0].name).toBe('Dr. Priya Nair')
      expect(rows[0].role).toBe('Cardiologist')
      expect(rows[0].organization).toBe('Metro Heart Center')
      expect(rows[0].status).toBe('pending')
    } finally {
      await context.close()
    }
  }, 60000)

  it('verifies live production signup gating (/signup -> /#demo, 403 on sign-up API) and auth redirects (/dashboard & /admin -> /login)', async () => {
    const context: BrowserContext = await browser!.newContext()
    const page = await context.newPage()

    try {
      // 1. Visiting /signup on live deployment redirects to /#demo
      await page.goto(`${LIVE_BASE_URL}/signup`, {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      })
      expect(page.url()).toContain('/#demo')

      // 2. Direct POST to live /api/auth/sign-up/email is blocked with 403
      const apiRes = await page.request.post(`${LIVE_BASE_URL}/api/auth/sign-up/email`, {
        data: {
          name: 'Blocked User',
          email: `blocked-${runSuffix}@carenote.test`,
          password: 'Password123!',
        },
      })
      expect(apiRes.status()).toBe(403)
      const body = await apiRes.json()
      expect(body.error).toContain('Public registration is closed')

      // 3. Unauthenticated visit to live /dashboard redirects to /login
      await page.goto(`${LIVE_BASE_URL}/dashboard`, {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      })
      expect(page.url()).toContain('/login')

      // 4. Unauthenticated visit to live /admin redirects to /login
      await page.goto(`${LIVE_BASE_URL}/admin`, {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      })
      expect(page.url()).toContain('/login')
    } finally {
      await context.close()
    }
  }, 60000)

  it('signs in on live https://carenote.in/login in Chromium, initializes a patient graph on /dashboard, verifies PaperTrail citations, and executes a live Temporal Memory Query on /dashboard/patients/[id]', async () => {
    // Provision real Better Auth user + workspace in shared Neon Postgres
    const created = await auth.api.signUpEmail({
      body: {
        email: testClinicianEmail,
        password: testClinicianPassword,
        name: 'Dr. Ethan Cole Live E2E',
      },
    })
    createdUserId = created.user.id

    const [ws] = await db
      .insert(workspaces)
      .values({
        user_id: createdUserId,
        email: testClinicianEmail,
        name: 'Dr. Ethan Cole Live E2E',
      })
      .returning()
    createdWorkspaceId = ws.id

    const context: BrowserContext = await browser!.newContext()
    const page = await context.newPage()

    try {
      // 1. Log in through live https://carenote.in/login UI
      await page.goto(`${LIVE_BASE_URL}/login`, { waitUntil: 'load', timeout: 45000 })
      await page.locator('input[name="email"]').fill(testClinicianEmail)
      await page.locator('input[name="password"]').fill(testClinicianPassword)
      await page.getByRole('button', { name: 'Sign in' }).click()

      await page.waitForURL('**/dashboard', { timeout: 30000 })
      await page.waitForLoadState('load')

      // 2. Initialize a new Patient Graph via the live dashboard modal
      const initBtn = page.getByRole('button', { name: '+ Initialize Patient Graph' }).first()
      await initBtn.waitFor({ state: 'visible', timeout: 15000 })
      await initBtn.click()

      await page.locator('input[name="name"]').fill('Eleanor Vance Live E2E')
      await page.locator('input[name="date_of_birth"]').fill('1958-04-19')
      await page.locator('select[name="biological_sex"]').selectOption('Female')
      await page.getByRole('button', { name: 'Initialize Graph' }).click()

      // Wait for the new patient card to appear on live /dashboard
      await page
        .getByText('Eleanor Vance Live E2E')
        .first()
        .waitFor({ state: 'visible', timeout: 20000 })

      const [patientRow] = await db
        .select()
        .from(patients)
        .where(eq(patients.workspace_id, createdWorkspaceId))
      expect(patientRow).toBeDefined()
      expect(patientRow.name).toBe('Eleanor Vance Live E2E')
      createdPatientId = patientRow.id

      // 3. Seed an extracted clinical record, Zep episode, and completed longitudinal synthesis
      const [rec] = await db
        .insert(clinicalRecords)
        .values({
          patient_id: patientRow.id,
          workspace_id: createdWorkspaceId,
          filename: 'nephrology_consult_2026.pdf',
          blob_url: 'https://test.public.blob.vercel-storage.com/nephrology_consult_2026.pdf',
          status: 'extracted',
          record_date: '2026-02-10',
          record_type: 'Specialist Consult',
        })
        .returning()

      await indexClinicalRecordFacts(
        createdWorkspaceId,
        patientRow.id,
        rec.id,
        'nephrology_consult_2026.pdf',
        {
          recordDate: '2026-02-10',
          recordType: 'Specialist Consult',
          medications: [
            {
              name: 'Spironolactone',
              dose: '25mg',
              frequency: 'daily (HELD)',
              status: 'discontinued',
              pageNumber: 2,
            },
          ],
          lab_values: [
            {
              name: 'Potassium',
              value: '5.6',
              unit: 'mEq/L',
              referenceRange: '3.5-5.0',
              flag: 'HIGH',
              pageNumber: 2,
            },
          ],
          conditions: [{ name: 'Hyperkalemia', status: 'active', pageNumber: 2 }],
          otherObservations: [],
        }
      )

      await db.insert(clinicalSyntheses).values({
        patient_id: patientRow.id,
        workspace_id: createdWorkspaceId,
        status: 'complete',
        synthesis_text:
          '### Renal & Medication Reconciliation\nSpironolactone 25mg daily was held due to serum potassium reaching 5.6 mEq/L [claim:c1].',
        claims: [
          {
            claim_id: 'c1',
            claim_text: 'Spironolactone 25mg held for hyperkalemia (K+ 5.6 mEq/L)',
            claim_type: 'medication',
            flag: 'SUPPORTED',
            evidence: [
              {
                source_record_id: rec.id,
                source_page: 2,
                source_quote: 'Hold Spironolactone 25mg daily given K+ 5.6 mEq/L',
              },
            ],
          },
        ],
        flagged_concerns: [
          {
            severity: 'high',
            description:
              'Hyperkalemia (5.6 mEq/L) requiring immediate potassium-sparing diuretic hold.',
          },
        ],
      })

      // 4. Navigate to the live Patient Detail Workspace on https://carenote.in and verify PaperTrail UI
      await page.goto(`${LIVE_BASE_URL}/dashboard/patients/${patientRow.id}`, {
        waitUntil: 'load',
        timeout: 45000,
      })

      await page
        .getByText('Eleanor Vance Live E2E')
        .first()
        .waitFor({ state: 'visible', timeout: 15000 })
      await page
        .getByText(/Hyperkalemia \(5\.6 mEq\/L\) requiring immediate potassium-sparing diuretic hold/i)
        .waitFor({ state: 'visible', timeout: 15000 })

      const citationChip = page.getByRole('button', {
        name: /Specialist Consult · 10 Feb 26 · p\.2/i,
      })
      await citationChip.waitFor({ state: 'visible', timeout: 15000 })
      expect(await citationChip.isVisible()).toBe(true)

      // 5. Switch to Temporal Memory Query tab on live https://carenote.in and execute a live query
      await page.getByRole('button', { name: /Temporal Memory Query/i }).click()
      const queryInput = page.getByPlaceholder(/Ask a longitudinal question/i)
      await queryInput.waitFor({ state: 'visible', timeout: 10000 })
      await queryInput.fill('Why was Spironolactone held and what was the potassium level?')
      await page.getByRole('button', { name: /Query Graph Memory/i }).click()

      // Wait for the live Vercel Server Action (Zep + Gemini) to stream/return the grounded answer
      await page
        .getByText(/5\.6/)
        .first()
        .waitFor({ state: 'visible', timeout: 45000 })
    } finally {
      await context.close()
    }
  }, 120000)
})
