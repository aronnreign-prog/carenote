# CareNote: Longitudinal Clinical Memory & Verifiable PaperTrail

CareNote is a research-stage prototype testing whether a patient-specific graph helps reviewers reconstruct changing clinical state across fragmented records. It has no external pilot proof or clinical outcome evidence.

The current implementation ingests clinical-record PDFs, extracts structured facts with encounter dates and page numbers, and indexes them into a patient-specific graph using Zep Cloud.

CareNote can generate a **Longitudinal Clinical Synthesis** or answer a temporal query. PaperTrail displays record and page anchors when present. A deterministic structural check now blocks source-backed claims when their marker, record ID, or page is missing from the retrieved context. It does not verify that a claim is correctly interpreted, that a quotation entails it, or that the system is clinically accurate.

---

## Core Architectural Pillars

### 1. Patient-specific graph retrieval (`src/lib/zep/ingest.ts`)
CareNote serializes clinical encounters (`serializeEncounterToGraphEpisode`) with encounter-date timestamps and provenance tags (`[record_id: <uuid>]`, `[page: <number>]`) into a per-patient Zep Context Graph. The application does not currently store explicit `valid_from` and `valid_to` fields for every clinical assertion.
- **3-Layer Graph Retrieval (`queryPatientMemory`)**:
  1. **Longitudinal Entity Nodes**: Canonical medications, diagnoses, lab markers, and clinicians.
  2. **Chronological Episodes**: Full encounter records with page-level provenance anchors.
  3. **Multi-Domain Temporal Edges**: Concurrent domain searches across pharmacotherapy, labs, conditions, and clinical events, explicitly distinguishing `[ACTIVE]` facts from `[SUPERSEDED/INVALIDATED]` facts.

### 2. Multimodal Clinical Record Extraction (`src/lib/ai/extract.ts`)
Raw PDFs are analyzed visually by Gemini 2.5 Flash against `ClinicalExtractionSchema`, capturing:
- Encounter metadata (`recordDate`, `recordType`, `provider`, `specialty`, `encounterContext`)
- Medications (`name`, `dose`, `frequency`, `route`, `status`, `prescribedDate`, `pageNumber`)
- Lab values (`name`, `value`, `unit`, `referenceRange`, `flag`, `date`, `pageNumber`)
- Conditions & diagnoses (`name`, `status`, `onsetDate`, `pageNumber`)

### 3. Longitudinal Clinical Synthesis & PaperTrail checks (`src/components/clinical/`)
Every generated `ClinicalSynthesis` is structured around four clinical sections:
1. **Patient Demographics & Baseline Overview**
2. **Longitudinal Clinical Trajectory**
3. **Active Pharmacotherapy & Multi-System Baselines**
4. **Flagged Safety Concerns & Discrepancies**

Generated claims carry typed fields such as `SUPPORTED`, `CONFLICTING`, `UNVERIFIED`, and `notable_absence`. The PaperTrail structural check verifies marker-to-claim matching and the presence of cited record/page anchors in retrieved context. It does not establish semantic support or clinical correctness.

---

## Stack

- **Framework**: Next.js 16.2 (App Router, Server Actions, SSE Streaming) + React 19 + TypeScript
- **Database**: Neon Serverless Postgres + Drizzle ORM (`clinicalRecords`, `clinicalSyntheses`, `patients`, `workspaces`)
- **Temporal Graph Memory**: Zep Cloud V3 Context Graph API (`@getzep/zep-cloud`)
- Multimodal Extraction & Synthesis: Google Gemini 2.5 Flash via Vercel AI SDK (`generateObject`, `streamObject`)
- PaperTrail integrity: deterministic structural checks for claim IDs and retrieved source record/page anchors
- **Authentication**: Better Auth (cookie sessions + Admin plugin for curated demo provisioning)
- **Record Storage**: Vercel Blob (authenticated streaming proxy with `Content-Security-Policy: sandbox` and SSRF origin validation)

---

## Development & Verification

```bash
# Install dependencies
npm install

# Push Drizzle schema to Neon Postgres
npx drizzle-kit push

# Run development server
npm run dev

# Run TypeScript check and test suite
npx tsc --noEmit
npm test
```

Unit and DOM tests exercise software contracts only. They are not evidence of clinical validity, accuracy, safety, or clinical utility. The Patient R.K. scenario shown on the homepage is fictional, hard-coded demonstration content. It is not a real case or a live product result.
