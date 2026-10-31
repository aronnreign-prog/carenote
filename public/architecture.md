# CareNote architecture: patient-specific graph retrieval and PaperTrail

> Author: CareNote Engineering & Clinical Informatics Group  
> Published: October 2026  
> Canonical URL: https://carenote.in/architecture.md  
> Machine-Readable Context: https://carenote.in/llms.txt

---

## 1. Abstract & Core Thesis

CareNote is a research-stage prototype that indexes clinical-record PDFs into patient-specific graph memory, then retrieves graph entities, dated episodes, and temporal relationships for longitudinal synthesis and queries.

The research question is whether this graph-based representation helps a knowledgeable reviewer reconstruct changing clinical state, inspect relationships, and trace claims back to source pages. CareNote has not established that it outperforms ordinary search or other graph/RAG systems.

The current application sends encounter dates to the graph service and reads temporal-validity metadata returned during retrieval. The application does not maintain explicit `valid_from` and `valid_to` fields for every clinical assertion. PaperTrail presents source-record and page anchors when available. It does not prove that a claim is true or that the system interpreted its source correctly.

---

## 2. Review risks CareNote is designed to make inspectable

### Changing states across encounters
An earlier record and a later record can describe different states of a medication, condition, or plan. A reviewer needs to see the event date and underlying source, and should not treat a generated current status as clinical truth without review.

### Contradictory records
Different encounters can contain conflicting claims. CareNote's interface represents a conflict state, but no independent evaluation has yet measured whether it identifies or characterizes contradictions correctly.

### Relationships and unresolved actions
Relationships among treatments, symptoms, test results, and follow-up can matter over time. CareNote's graph is a proposed way to present candidate relationships for review. It does not establish causality or guarantee detection of every unresolved action.

---

## 3. The CareNote architecture

```
[Clinical Encounter PDF Intake]
              │
              ▼
[Visual Multimodal Extraction] ──> Gemini 2.5 Flash + ClinicalExtractionSchema
              │                     - Captures exact encounter metadata, labs, meds, conditions
              │                     - Retains physical page numbers (#page=N) without extrapolation
              ▼
[Graph Episode Serialization] ────> serializeEncounterToGraphEpisode()
              │                     - Formats chronological episodes with [record_id] & [page] tags
              │                     - Assigns authentic encounter ISO timestamps
              ▼
[Patient-Specific Graph Memory] ──> Zep Cloud V3 Context Graph
              │                     - Encounter-date timestamps
              │                     - Temporal validity metadata returned by graph service
              ▼
[3-Layer Memory Retrieval] ───────> queryPatientMemory()
              │                     1. Longitudinal Entity Nodes (canonical summaries)
              │                     2. Chronological Episodes (sorted encounters with anchors)
              │                     3. Multi-Domain Temporal Edges (concurrent domain search)
              ▼
[Synthesis & Structural Check] ───> streamObject() with ClinicalSynthesisSchema
              │                     - Check claim IDs and retrieved record/page anchors
              │                     - Fail synthesis when source-backed anchors are missing or ambiguous
              ▼
[The PaperTrail Review Surface] ──> Authenticated PDF viewer (/api/records/[id]/view#page=N)
```

### A. Multimodal Visual Extraction
CareNote processes PDFs visually using Google Gemini 2.5 Flash against `ClinicalExtractionSchema`. Standard OCR flattens multi-column lab panels, losing row-to-header relationships. CareNote's visual intake extracts values, units, reference intervals, flags, and physical page numbers directly from the rendered page layout.

### B. Encounter dates and graph validity
The application attaches the extracted encounter date as the graph episode's `createdAt` timestamp when that date is valid. Graph search results may include `validAt` and `invalidAt` fields, which CareNote formats as temporal metadata. The application does not own explicit transaction-time and valid-time columns for each fact, and temporal-state correctness has not been independently evaluated.

### C. 3-Layer Graph Retrieval
When synthesizing patient history or executing a clinical query, CareNote queries three distinct graph layers concurrently:
1. **Longitudinal Entity Nodes:** High-level canonical summaries of key clinical entities (conditions, drugs, providers).
2. **Chronological Episodes:** Encounter records organized by encounter timestamps with provenance anchors.
3. **Multi-Domain Temporal Edges:** Dynamic graph search across pharmacotherapy, lab trajectories, and clinical events, explicitly segmenting active facts from invalidated ones.

### D. PaperTrail structural integrity check
Before accepting source-backed output, CareNote checks that:
- inline claim markers match claim records;
- source-backed claims have evidence entries with a record ID and 1-indexed page;
- each cited record/page anchor occurs unambiguously on a retrieved source-fact line.

The check does not compare a claim's meaning with the cited text, verify extraction accuracy, or establish clinical correctness. Generated claims may carry these labels:
- **`SUPPORTED`:** Backed by authentic source encounter records.
- **`CONFLICTING`:** Cross-encounter contradiction detected (e.g., diagnostic test refuting copy-forwarded chart lore).
- **`notable_absence`:** Unclosed therapeutic loop or missing baseline (e.g., a held drug whose resumption threshold was met but never ordered).
- **`MEDICAL_KNOWLEDGE`:** Established clinical pharmacology or pathology principles explaining mechanism of action.

When source anchors are present, a citation chip can navigate to the cited page (`/api/records/[id]/view#page=N`) via the authenticated PDF viewer. Reviewability is not a guarantee of correctness.

---

## 4. Self-Contained Answer Blocks for Technical Evaluators & AI Search

**What is CareNote testing?**
CareNote is testing whether a patient-specific graph and source-page review surface help knowledgeable reviewers reconstruct changing clinical state and inspect evidence across fragmented records. Comparative performance has not been established.

**How does CareNote represent time?**
CareNote indexes clinical encounter records into a patient-specific graph, using encounter dates and temporal validity metadata returned by the graph service during retrieval. The application does not maintain explicit `valid_from` and `valid_to` fields for every clinical assertion, so temporal-state accuracy remains a research question.

**What is The PaperTrail in CareNote?**
PaperTrail renders claim evidence with links to source records and page numbers when those anchors are available. A structural check rejects source-backed claims with missing or ambiguous record/page anchors. The check does not establish that a generated claim is correct or that cited text supports the claim.

---

## 5. Collaboration and Participation

CareNote is a research-stage prototype seeking qualified clinical-informatics and health-tech collaborators to evaluate its approach. It has no external pilot proof or clinical outcome evidence. The Patient R.K. scenario on the homepage is a fictional, hard-coded demonstration, not a real patient case or a live product result. Review the [synthetic demonstration](https://carenote.in/#demo) or the [collaboration brief](https://carenote.in/collaborate.md).
