# CareNote: Longitudinal Clinical Memory & Verifiable PaperTrail

Medical history is not a disconnected set of text chunks. It is an evolving graph across time.

CareNote ingests clinical encounter PDFs (prescriptions, multi-column lab panels, discharge summaries, and specialist consult notes), extracts structured clinical entities with encounter dates and physical page numbers via multimodal vision, and indexes them into a persistent bi-temporal knowledge graph (Zep Cloud).

When a clinician, care coordinator, or patient generates a **Longitudinal Clinical Synthesis** or queries the patient's history, CareNote traverses the patient's temporal graph (reconciling active vs. superseded medications, longitudinal lab trends, and cross-provider contradictions) and binds every single assertion to an interactive **PaperTrail** citation (`#page=N`) that opens the exact page of the source PDF.

---

## Core Architectural Pillars

### 1. Bi-Temporal Clinical Graph Memory (`src/lib/zep/ingest.ts`)
Standard vector RAG chops medical PDFs into isolated paragraphs and loses track of whether a medication was started, titrated, or discontinued across encounters. CareNote serializes each clinical encounter (`serializeEncounterToGraphEpisode`) with explicit temporal anchors (`createdAt`) and provenance tags (`[record_id: <uuid>]`, `[page: <number>]`) into a per-patient Zep Context Graph.
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

### 3. Longitudinal Clinical Synthesis & PaperTrail Verification (`src/components/clinical/`)
Every generated `ClinicalSynthesis` is structured around four clinical sections:
1. **Patient Demographics & Baseline Overview**
2. **Longitudinal Clinical Trajectory**
3. **Active Pharmacotherapy & Multi-System Baselines**
4. **Flagged Safety Concerns & Discrepancies**

Every factual assertion is bound to a typed `Claim` (`SUPPORTED`, `CONFLICTING`, `MEDICAL_KNOWLEDGE`, `UNVERIFIED`, or `notable_absence`) with clickable inline PaperTrail chips that stream the authenticated source PDF directly to the cited page (`/api/records/[id]/view#page=N`).

---

## Stack

- **Framework**: Next.js 16.2 (App Router, Server Actions, SSE Streaming) + React 19 + TypeScript
- **Database**: Neon Serverless Postgres + Drizzle ORM (`clinicalRecords`, `clinicalSyntheses`, `patients`, `workspaces`)
- **Temporal Graph Memory**: Zep Cloud V3 Context Graph API (`@getzep/zep-cloud`)
- **Multimodal Extraction & Synthesis**: Google Gemini 2.5 Flash via Vercel AI SDK (`generateObject`, `streamObject`)
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
