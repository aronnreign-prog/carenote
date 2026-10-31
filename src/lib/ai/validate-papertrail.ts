export type PaperTrailEvidence = {
  source_record_id?: string
  source_page?: number
  source_quote?: string
  entry_text?: string
}

export type PaperTrailClaim = {
  claim_id: string
  claim_type?: string
  flag?: string
  evidence?: PaperTrailEvidence[]
}

export type PaperTrailValidation = {
  valid: boolean
  errors: string[]
}

function hasRecordPageAnchor(context: string, recordId: string, page: number): boolean {
  // Each serialized source fact carries its own record/page tags. Requiring
  // both on the same line prevents borrowing a record ID or page from a
  // neighboring fact in the same episode.
  const recordAnchor = `[record_id: ${recordId}]`
  const alternateRecordAnchor = `[doc_id: ${recordId}]`
  const pageAnchor = `[page: ${page}]`
  const lines = context.split(/\r?\n/)
  const matchingRecordPageLines = lines.filter((line) =>
    (line.includes(recordAnchor) || line.includes(alternateRecordAnchor)) &&
    line.includes(pageAnchor)
  )
  return matchingRecordPageLines.length === 1
}

/**
 * Deterministic structural check for the PaperTrail contract.
 *
 * This confirms that source-backed claim IDs and cited record/page anchors are
 * present on one retrieved line. It does not establish that
 * the model's interpretation is clinically correct or that a quote semantically supports it.
 */
export function validatePaperTrailClaims(
  text: string,
  claims: PaperTrailClaim[],
  context: string,
): PaperTrailValidation {
  const errors: string[] = []
  const inlineIds = Array.from(text.matchAll(/\[claim:([^\]]+)\]/g), (match) => match[1].trim())
  const claimIds = claims.map((claim) => claim.claim_id)
  const uniqueClaimIds = new Set(claimIds)
  const inlineIdSet = new Set(inlineIds)
  const claimIdSet = new Set(claimIds)

  if (uniqueClaimIds.size !== claimIds.length) {
    errors.push('Claim list contains duplicate claim IDs.')
  }

  for (const claimId of Array.from(inlineIdSet)) {
    if (!claimId || !claimIdSet.has(claimId)) {
      errors.push(`Inline claim marker "${claimId}" has no matching claim record.`)
    }
  }

  for (const claimId of Array.from(claimIdSet)) {
    if (!inlineIdSet.has(claimId)) {
      errors.push(`Claim "${claimId}" is not referenced in the synthesis text.`)
    }
  }

  for (const claim of claims) {
    const requiresSourceAnchor =
      claim.claim_type === 'source_record' ||
      ['SUPPORTED', 'PARTIALLY SUPPORTED', 'CONFLICTING'].includes(claim.flag ?? '')

    if (!requiresSourceAnchor) {
      if (claim.evidence?.some((evidence) => evidence.source_record_id || evidence.source_page !== undefined)) {
        errors.push(`Non-source claim "${claim.claim_id}" contains source record/page evidence.`)
      }
      continue
    }

    if (!claim.evidence?.length) {
      errors.push(`Source-backed claim "${claim.claim_id}" has no PaperTrail evidence.`)
      continue
    }

    for (const [index, evidence] of Array.from(claim.evidence.entries())) {
      const recordId = evidence.source_record_id?.trim()
      const page = evidence.source_page
      if (evidence.source_quote !== undefined && evidence.source_quote.trim().length === 0) {
        errors.push(`Evidence ${index + 1} for claim "${claim.claim_id}" contains an empty source quote.`)
      }
      if (evidence.source_quote !== undefined && evidence.source_quote.length > 500) {
        errors.push(`Evidence ${index + 1} for claim "${claim.claim_id}" exceeds 500 characters.`)
      }
      if (evidence.entry_text !== undefined && evidence.entry_text.trim().length === 0) {
        errors.push(`Evidence ${index + 1} for claim "${claim.claim_id}" contains empty entry text.`)
      }
      if (!recordId || !Number.isInteger(page) || (page ?? 0) < 1) {
        errors.push(
          `Evidence ${index + 1} for claim "${claim.claim_id}" must include a source record ID and a 1-indexed page.`,
        )
        continue
      }

      if (!hasRecordPageAnchor(context, recordId, page!)) {
        errors.push(
          `Evidence ${index + 1} for claim "${claim.claim_id}" does not match a retrieved record/page anchor.`,
        )
      }
    }
  }

  return { valid: errors.length === 0, errors }
}