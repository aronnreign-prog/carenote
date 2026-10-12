import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { computeAdminUserList } from '../src/app/admin/page.tsx'

describe('Admin User List Aggregation & Memory Bounding', () => {
  const mockAuthUsers = [
    {
      id: 'user-001',
      name: 'Alice Clinician',
      email: 'alice@example.com',
      role: 'user',
      banned: false,
      banReason: null,
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'user-002',
      name: 'Bob Admin',
      email: 'bob@example.com',
      role: 'admin',
      banned: false,
      banReason: null,
      createdAt: '2026-02-01T00:00:00.000Z',
    },
    {
      id: 'user-003',
      name: 'Charlie New',
      email: 'charlie@example.com',
      role: 'user',
      banned: false,
      banReason: null,
      createdAt: '2026-03-01T00:00:00.000Z',
    },
  ]

  const mockWorkspaces = [
    { id: 'ws-001', user_id: 'user-001' },
    { id: 'ws-002', user_id: 'user-002' },
  ]

  const mockPatientCounts = [
    { workspace_id: 'ws-001', count: 4 },
    { workspace_id: 'ws-002', count: 1 },
  ]

  const mockRecordCounts = [
    { workspace_id: 'ws-001', count: 18 },
    { workspace_id: 'ws-002', count: 0 },
  ]

  test('accurately maps aggregated patient and clinical record counts to users', () => {
    const result = computeAdminUserList(
      mockAuthUsers,
      mockWorkspaces,
      mockPatientCounts,
      mockRecordCounts
    )

    assert.equal(result.length, 3)

    const alice = result.find((u) => u.id === 'user-001')
    assert.ok(alice)
    assert.equal(alice.name, 'Alice Clinician')
    assert.equal(alice.patientCount, 4)
    assert.equal(alice.indexedRecordCount, 18)

    const bob = result.find((u) => u.id === 'user-002')
    assert.ok(bob)
    assert.equal(bob.name, 'Bob Admin')
    assert.equal(bob.patientCount, 1)
    assert.equal(bob.indexedRecordCount, 0)
  })

  test('gracefully handles users with no workspace record (defaulting counts to 0)', () => {
    const result = computeAdminUserList(
      mockAuthUsers,
      mockWorkspaces,
      mockPatientCounts,
      mockRecordCounts
    )

    const charlie = result.find((u) => u.id === 'user-003')
    assert.ok(charlie)
    assert.equal(charlie.patientCount, 0)
    assert.equal(charlie.indexedRecordCount, 0)
  })

  test('gracefully handles empty inputs across all lists', () => {
    const result = computeAdminUserList([], [], [], [])
    assert.deepEqual(result, [])
  })

  test('handles numeric and string count representations from SQL aggregates', () => {
    const stringCounts = [
      { workspace_id: 'ws-001', count: '12' },
    ]
    const stringRecordCounts = [
      { workspace_id: 'ws-001', count: '45' },
    ]

    const result = computeAdminUserList(
      [mockAuthUsers[0]],
      [mockWorkspaces[0]],
      stringCounts,
      stringRecordCounts
    )

    assert.equal(result[0].patientCount, 12)
    assert.equal(result[0].indexedRecordCount, 45)
  })
})
