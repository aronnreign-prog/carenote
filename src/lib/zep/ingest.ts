/**
 * src/lib/zep/ingest.ts
 * Index extracted clinical facts into Zep Cloud with bi-temporal valid_from dates.
 * Uses Zep Cloud V3 graph API: client.graph.add / client.graph.search
 */

import { ZepClient } from '@getzep/zep-cloud'
import type { ClinicalExtraction } from '@/lib/ai/extract'

let _client: ZepClient | null = null

function getZepClient(): ZepClient {
  if (_client) return _client
  const apiKey = process.env.ZEP_API_KEY
  if (!apiKey) throw new Error('ZEP_API_KEY environment variable is required')
  _client = new ZepClient({ apiKey })
  return _client
}

// In Zep Cloud V3, facts are scoped to a userId (workspace + patient composite)
// We use a deterministic userId per patient so all their clinical records accumulate in one graph
function zepUserId(workspaceId: string, patientId: string): string {
  return 'workspace-' + workspaceId + '-patient-' + patientId
}

export function escapeXmlContent(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

async function ensureZepUser(userId: string): Promise<void> {
  const client = getZepClient()
  try {
    await client.user.add({ userId }, { timeoutInSeconds: 15 })
  } catch {
    // User likely already exists: idempotent
  }
}

export function serializeEncounterToGraphEpisode(
  extraction: ClinicalExtraction,
  recordId: string,
  filename: string,
): string {
  const encounterDate = extraction.recordDate ?? 'Date unknown / not documented'
  const lines: string[] = []

  // ── Encounter context header ──────────────────────────────────────────────
  lines.push(`CLINICAL ENCOUNTER RECORD: ${filename} (record_id: ${recordId})`)
  lines.push(`Record type: ${extraction.recordType ?? 'Unspecified'}`)
  lines.push(`Encounter date: ${encounterDate}`)
  if (extraction.provider) lines.push(`Provider: ${extraction.provider}`)
  if (extraction.specialty) lines.push(`Specialty: ${extraction.specialty}`)
  if (extraction.encounterContext) lines.push(`Encounter context: ${extraction.encounterContext}`)

  // ── Lab values ────────────────────────────────────────────────────────────
  if (extraction.lab_values.length > 0) {
    lines.push('\nLAB RESULTS:')
    for (const lab of extraction.lab_values) {
      const onDate = lab.date ? `On ${lab.date}` : (extraction.recordDate ? `On ${extraction.recordDate}` : 'Date unknown')
      const val = lab.unit ? `${lab.value} ${lab.unit}` : lab.value
      const range = lab.referenceRange ? ` (ref: ${lab.referenceRange})` : ''
      const flag = lab.flag ? ` [${lab.flag}]` : ''
      const page = lab.pageNumber ? ` [page: ${lab.pageNumber}]` : ''
      lines.push(`  ${onDate}, ${lab.name} was ${val}${range}${flag}.${page} [record_id: ${recordId}]`)
    }
  }

  // ── Medications ───────────────────────────────────────────────────────────
  if (extraction.medications.length > 0) {
    lines.push('\nMEDICATIONS:')
    for (const med of extraction.medications) {
      const onDate = med.prescribedDate ? `On ${med.prescribedDate}` : (extraction.recordDate ? `On ${extraction.recordDate}` : 'Date unknown')
      const parts: string[] = [med.name]
      if (med.dose) parts.push(med.dose)
      if (med.frequency) parts.push(med.frequency)
      if (med.route) parts.push(`(${med.route})`)
      const page = med.pageNumber ? ` [page: ${med.pageNumber}]` : ''
      lines.push(`  ${onDate}, ${parts.join(' ')} documented as ${med.status}.${page} [record_id: ${recordId}]`)
    }
  }

  // ── Conditions ────────────────────────────────────────────────────────────
  if (extraction.conditions.length > 0) {
    lines.push('\nCONDITIONS / DIAGNOSES:')
    for (const cond of extraction.conditions) {
      const onDate = cond.onsetDate ? `As of ${cond.onsetDate}` : (extraction.recordDate ? `As of ${extraction.recordDate}` : 'Date unknown')
      const status = cond.status ? ` (${cond.status})` : ''
      const page = cond.pageNumber ? ` [page: ${cond.pageNumber}]` : ''
      lines.push(`  ${onDate}, ${cond.name}${status}.${page} [record_id: ${recordId}]`)
    }
  }

  // ── Other clinical observations ───────────────────────────────────────────
  if (extraction.otherObservations.length > 0) {
    lines.push('\nCLINICAL NOTES:')
    for (const obs of extraction.otherObservations) {
      lines.push(`  ${obs} [record_id: ${recordId}]`)
    }
  }

  // ── Source provenance ─────────────────────────────────────────────────────
  lines.push(`\nSOURCE: ${filename} (record_id: ${recordId})`)

  return lines.join('\n')
}

export function segmentClinicalEpisodes(
  fullContent: string,
  continuationHeader: string,
  maxSegmentLength = 7500,
): string[] {
  if (fullContent.length <= maxSegmentLength) {
    return [fullContent]
  }

  const paragraphs = fullContent.split(/\n\n+/).filter((p) => p.trim().length > 0)
  const episodeSegments: string[] = []
  let currentSegment: string[] = []
  let currentLength = 0

  const flushParagraphSegment = () => {
    if (currentSegment.length === 0) return
    const body = currentSegment.join('\n\n')
    episodeSegments.push(episodeSegments.length === 0 ? body : `${continuationHeader}\n\n${body}`)
    currentSegment = []
    currentLength = 0
  }

  for (const paragraph of paragraphs) {
    if (paragraph.length > maxSegmentLength) {
      flushParagraphSegment()
      const lines = paragraph.split('\n')
      let lineSegment: string[] = []
      let lineLength = 0

      const flushLineSegment = () => {
        if (lineSegment.length === 0) return
        const body = lineSegment.join('\n')
        episodeSegments.push(episodeSegments.length === 0 ? body : `${continuationHeader}\n\n${body}`)
        lineSegment = []
        lineLength = 0
      }

      for (const line of lines) {
        if (line.length > maxSegmentLength) {
          flushLineSegment()
          for (let offset = 0; offset < line.length; offset += maxSegmentLength) {
            const slice = line.slice(offset, offset + maxSegmentLength)
            episodeSegments.push(episodeSegments.length === 0 ? slice : `${continuationHeader}\n\n${slice}`)
          }
          continue
        }

        if (lineLength + line.length + (lineSegment.length > 0 ? 1 : 0) > maxSegmentLength && lineSegment.length > 0) {
          flushLineSegment()
        }
        lineLength += line.length + (lineSegment.length > 0 ? 1 : 0)
        lineSegment.push(line)
      }

      flushLineSegment()
    } else {
      if (currentLength + paragraph.length + (currentSegment.length > 0 ? 2 : 0) > maxSegmentLength && currentSegment.length > 0) {
        flushParagraphSegment()
      }
      currentLength += paragraph.length + (currentSegment.length > 0 ? 2 : 0)
      currentSegment.push(paragraph)
    }
  }

  flushParagraphSegment()

  return episodeSegments
}

export interface IngestResult {
  success: boolean
  error?: string
}

export async function indexClinicalRecordFacts(
  workspaceId: string,
  patientId: string,
  recordId: string,
  filename: string,
  extraction: ClinicalExtraction,
): Promise<IngestResult> {
  try {
    const client = getZepClient()
    const userId = zepUserId(workspaceId, patientId)
    await ensureZepUser(userId)

    const episodeContent = serializeEncounterToGraphEpisode(extraction, recordId, filename)
    const encounterDate = extraction.recordDate ?? 'Date unknown / not documented'
    const continuationHeader = `CLINICAL ENCOUNTER RECORD (CONTINUATION): ${filename} (record_id: ${recordId}) | Date: ${encounterDate}`

    const episodeSegments = segmentClinicalEpisodes(episodeContent, continuationHeader, 7500)

    // Only supply created_at if an authentic, verified encounter date exists in ISO format.
    // If undated/missing, do NOT pass created_at or today's timestamp so it remains strictly undated.
    let createdAt: string | undefined = undefined
    if (extraction.recordDate && /^\d{4}-\d{2}-\d{2}/.test(extraction.recordDate)) {
      const parsedDate = new Date(extraction.recordDate)
      if (!isNaN(parsedDate.getTime())) {
        createdAt = parsedDate.toISOString()
      }
    }

    // Index each episode segment sharing the same recordId and createdAt per Zep documentation
    for (const segment of episodeSegments) {
      await client.graph.add(
        {
          data: segment,
          type: 'text',
          userId,
          createdAt,
          metadata: { recordId },
        },
        { timeoutInSeconds: 30 }
      )
    }

    return { success: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[Zep] Graph indexing failed:', message)
    return { success: false, error: message }
  }
}

export async function queryPatientMemory(
  workspaceId: string,
  patientId: string,
  query: string,
): Promise<string> {
  try {
    const client = getZepClient()
    const userId = zepUserId(workspaceId, patientId)

    // Ensure user exists before querying
    await ensureZepUser(userId)

    // ── Concurrent Multi-Layer Retrieval ──
    const cleanQuery = query.trim().slice(0, 380) || 'longitudinal clinical trajectory medications lab trends'

    const [nodesRes, episodesRes, searchRes] = await Promise.allSettled([
      client.graph.node.getByUserId(userId, { limit: 50 }, { timeoutInSeconds: 15 }),
      client.graph.episode.getByUserId(userId, { lastn: 30 }, { timeoutInSeconds: 15 }),
      client.graph.search(
        {
          userId,
          query: cleanQuery,
          scope: 'edges',
          limit: 45,
          reranker: 'mmr',
          mmrLambda: 0.6,
        },
        { timeoutInSeconds: 15 }
      ),
    ])

    // Layer 1: Entity Summaries
    let entitySummaries: string[] = []
    if (nodesRes.status === 'fulfilled' && Array.isArray(nodesRes.value)) {
      entitySummaries = nodesRes.value
        .filter((n) => n.summary && n.summary.trim().length > 0)
        .map((n) => {
          const labels = n.labels && n.labels.length > 0 ? ` (${n.labels.join(', ')})` : ''
          return `[Entity: ${n.name}${labels}] ${n.summary.trim()}`
        })
    } else if (nodesRes.status === 'rejected') {
      console.warn('[Zep] Entity node fetch skipped:', nodesRes.reason)
    }

    // Layer 2: Chronological Episodes
    let episodesContent: string[] = []
    if (episodesRes.status === 'fulfilled' && episodesRes.value?.episodes) {
      const sortedEpisodes = [...episodesRes.value.episodes].sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0
        return timeA - timeB
      })
      episodesContent = sortedEpisodes
        .map((ep) => ep.content?.trim())
        .filter((c): c is string => Boolean(c && c.length > 0))
    } else if (episodesRes.status === 'rejected') {
      console.warn('[Zep] Episodes fetch skipped:', episodesRes.reason)
    }

    // Layer 3: Temporal Edges
    const edgeList: string[] = []
    if (searchRes.status === 'fulfilled' && searchRes.value?.edges) {
      const edgeMap = new Map<string, string>()
      for (const e of searchRes.value.edges as any[]) {
        const fact = (e.fact ?? '').trim()
        if (!fact) continue
        const key = e.uuid || fact

        const rawValid = e.validAt ?? e.valid_at ?? e.attributes?.valid_at ?? e.attributes?.reference_time
        const rawInvalid = e.invalidAt ?? e.invalid_at ?? e.attributes?.invalid_at

        const validAt = rawValid ? String(rawValid).slice(0, 10) : 'date unknown'
        const invalidAt = rawInvalid ? String(rawInvalid).slice(0, 10) : 'present'
        const status = rawInvalid ? '[SUPERSEDED/INVALIDATED]' : '[ACTIVE]'

        const formattedFact = `- ${fact} (Date range: ${validAt} - ${invalidAt}) ${status}`
        if (!edgeMap.has(key)) {
          edgeMap.set(key, formattedFact)
        }
      }
      edgeList.push(...Array.from(edgeMap.values()))
    } else if (searchRes.status === 'rejected') {
      console.warn('[Zep] Edge search skipped:', searchRes.reason)
    }

    // If all layers are completely absent, return empty string for self-heal detection
    if (entitySummaries.length === 0 && episodesContent.length === 0 && edgeList.length === 0) {
      console.log('[Zep Retrieval] 0 entity nodes, 0 episodes, and 0 edges found for user:', userId)
      return ''
    }

    // ── Build clean XML Context Block following Zep Official Context Recipe ──
    const sections: string[] = []

    if (entitySummaries.length > 0) {
      sections.push(`<ENTITIES>\n# Key clinical entities and summaries:\n${entitySummaries.map((s) => `- ${escapeXmlContent(s)}`).join('\n')}\n</ENTITIES>`)
    }

    if (edgeList.length > 0) {
      sections.push(`<FACTS>\n# Longitudinal facts and valid date ranges (facts ending in "present" are currently active; past end dates are superseded):\n${edgeList.map((f) => escapeXmlContent(f)).join('\n')}\n</FACTS>`)
    }

    if (episodesContent.length > 0) {
      sections.push(`<CHRONOLOGICAL_EVIDENCE>\n# Source clinical records with exact [record_id: <uuid>] (or [doc_id: <uuid>]) and [page: <number>] anchors for citations:\n${episodesContent.map((c) => escapeXmlContent(c)).join('\n\n---\n\n')}\n</CHRONOLOGICAL_EVIDENCE>`)
    }

    const context = sections.join('\n\n')
    console.log('[Zep Retrieval] Context built: Entities:', entitySummaries.length, '| Facts:', edgeList.length, '| Episodes:', episodesContent.length, '| Chars:', context.length)
    return context
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[Zep] Memory query failed:', message)
    return ''
  }
}

export async function pruneRecordFromGraph(workspaceId: string, patientId: string, recordId: string): Promise<void> {
  try {
    const client = getZepClient()
    const userId = zepUserId(workspaceId, patientId)
    const response = await client.graph.episode.getByUserId(userId, { lastn: 100 }, { timeoutInSeconds: 15 })

    if (response?.episodes && Array.isArray(response.episodes)) {
      const matchingEpisodes = response.episodes.filter((ep) => {
        const meta = ep.metadata as Record<string, unknown> | undefined
        const matchesMeta = meta && (meta.recordId === recordId || meta.documentId === recordId)
        const matchesContent =
          ep.content &&
          (ep.content.includes(`record_id: ${recordId}`) ||
            ep.content.includes(`[record_id: ${recordId}]`) ||
            ep.content.includes(`document_id: ${recordId}`) ||
            ep.content.includes(`[doc_id: ${recordId}]`))
        return Boolean(matchesMeta || matchesContent)
      })

      for (const ep of matchingEpisodes) {
        if (ep.uuid) {
          await client.graph.episode.delete(ep.uuid, { timeoutInSeconds: 15 }).catch((err) => {
            console.warn(`[Zep] Failed to delete episode ${ep.uuid}:`, err)
          })
        }
      }
      console.log(`[Zep] Successfully pruned ${matchingEpisodes.length} episodes for clinical record:`, recordId)
    }
  } catch (err) {
    console.warn(`[Zep] Could not prune clinical record episodes for ${recordId}:`, err)
  }
}

export async function purgePatientGraphMemory(workspaceId: string, patientId: string): Promise<void> {
  try {
    const client = getZepClient()
    const userId = zepUserId(workspaceId, patientId)
    await client.user.delete(userId, { timeoutInSeconds: 15 })
    console.log('[Zep] Successfully purged patient memory graph for user:', userId)
  } catch (err) {
    console.warn('[Zep] Could not purge patient memory graph:', err)
  }
}