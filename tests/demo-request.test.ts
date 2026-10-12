import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { z } from 'zod'

const DemoRequestSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100, 'Name must be 100 characters or less'),
  email: z.string().trim().email('Valid email address is required').max(255, 'Email must be 255 characters or less'),
  organization: z.string().trim().max(200, 'Organization must be 200 characters or less').optional(),
  role: z.string().trim().max(100, 'Role must be 100 characters or less').optional(),
  useCase: z.string().trim().max(2000, 'Use case must be 2000 characters or less').optional(),
})

describe('Demo Request Validation & Payload Bounding', () => {
  test('accepts valid full input within bounds', () => {
    const valid = {
      name: 'Dr. Jane Smith',
      email: 'jane.smith@hospital.org',
      organization: 'Department of Nephrology',
      role: 'Attending Nephrologist',
      useCase: 'Longitudinal clinical synthesis across multi-provider referral records and serial renal panels',
    }

    const res = DemoRequestSchema.safeParse(valid)
    assert.equal(res.success, true)
  })

  test('accepts minimal required fields (name and email only)', () => {
    const minimal = {
      name: 'Dr. Jane Smith',
      email: 'jane.smith@hospital.org',
    }

    const res = DemoRequestSchema.safeParse(minimal)
    assert.equal(res.success, true)
  })

  test('rejects empty name after trimming whitespace', () => {
    const emptyName = {
      name: '   ',
      email: 'jane.smith@hospital.org',
    }

    const res = DemoRequestSchema.safeParse(emptyName)
    assert.equal(res.success, false)
  })

  test('rejects oversized string payloads (memory exhaustion protection)', () => {
    const oversized = {
      name: 'Dr. Jane',
      email: 'jane@example.com',
      useCase: 'X'.repeat(5000), // Exceeds 2000 chars
    }

    const res = DemoRequestSchema.safeParse(oversized)
    assert.equal(res.success, false)
    if (!res.success) {
      assert.ok(res.error.issues.some((i) => i.message.includes('2000 characters or less')))
    }
  })

  test('rejects malformed email addresses', () => {
    const invalidEmail = {
      name: 'Dr. Jane',
      email: 'not-an-email',
    }

    const res = DemoRequestSchema.safeParse(invalidEmail)
    assert.equal(res.success, false)
    if (!res.success) {
      assert.ok(res.error.issues.some((i) => i.message.includes('Valid email address is required')))
    }
  })
})
