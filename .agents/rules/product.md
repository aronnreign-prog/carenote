# Product Foundation Law: Temporal Memory & Clinical Synthesis Architecture

This rule is MANDATORY and PERMANENT across all coding, UI, and architectural work.

---

## 1. The Core Product Axiom

**Medical history is NOT a text chunk. It is an evolving graph.**

CareNote turns fragmented clinical encounter PDFs (discharge summaries, outpatient notes, multi-column lab panels, prescriptions, diagnostic reports) into a persistent, bi-temporal patient knowledge graph and produces **Longitudinal Clinical Syntheses** where every single assertion is directly verifiable against the original source record via **The PaperTrail**.

### Who Uses CareNote
Anyone managing complex, multi-provider medical records over time (patients and families navigating chronic or multi-system illness, independent care coordinators, and specialist clinicians) who needs a reconciled longitudinal clinical synthesis rather than an unverified, stateless AI summary.

---

## 2. The Two Technical Bets

1. **Temporal Graph Memory Instead of Vector Chunks:**
   Standard RAG tools chop PDFs into isolated text chunks in a vector database and retrieve by cosine similarity, suffering from **temporal blindness and anachronistic fact retrieval**. They repeat copy-pasted problem list labels ("chart lore"), present discontinued regimens alongside active orders as if they co-exist, and treat iatrogenic prescribing cascades as independent chronic diseases. CareNote models the patient's medical history as an evolving knowledge graph where entities (medications, conditions, lab panels, diagnostic findings, providers) connect across time with explicit `valid_from` and `valid_to` boundaries (`[ACTIVE]` vs `[SUPERSEDED]`), exposing multi-hop prescribing cascades, cross-record contradictions, and unclosed post-discharge holds.
2. **The PaperTrail (Zero Blind Trust):**
   Ungrounded AI summaries are dangerous in medicine. CareNote embeds interactive source anchors (`[claim:cN]`) for every factual assertion, classifying its epistemic basis (`SUPPORTED`, `CONFLICTING`, `notable_absence`, `MEDICAL_KNOWLEDGE`) and linking directly to the exact clinical record, page number (`#page=N`), and verbatim quote.

---

## 3. Anti-Generic Rules for Agents

### Rule 1: Never Fall into "Generic Document SaaS" or "Briefing Wrapper" Thinking
- DO NOT treat this app like Google Drive, Dropbox, NotebookLM, or a generic PDF chat/briefing wrapper.
- Raw PDFs are merely intake evidence; the core product asset is the **Patient's Evolving Temporal Graph** and its **Longitudinal Clinical Synthesis**.
- Never use generic file-management or AI-wrapper tropes (e.g., "Upload files", "Document list", "Briefing doc", "Chat with PDF").

### Rule 2: Enforce Clinical & Temporal Graph Vocabulary at All Levels (UI, Prompts, Types, Variables)
- Use **"Clinical Record"** (`ClinicalRecord`, `records`, `record_date`, `record_type`, `source_record_id`) instead of generic "Document" (`Document`, `documents`, `document_date`, `source_doc_id`).
- Use **"Clinical Records Timeline"** (`ClinicalTimeline`) instead of generic "Document List" (`DocumentList`).
- Use **"Index Clinical Record"** (`ClinicalRecordIndexer`, `indexClinicalRecord`) instead of generic "Upload Document" (`DocumentUploader`, `ingestDocument`).
- Use **"Longitudinal Clinical Synthesis"** (`ClinicalSynthesis`, `syntheses`, `synthesizePatientGraph`) instead of generic "Briefing" or "Document Summary" (`Briefing`, `briefings`, `generateBriefing`).
- Use **"Temporal Memory Query"** (`askPatientClinicalQuery`, `queryPatientMemory`) instead of generic "Chat with PDF".
- Use **"Episode Segmentation"** (`segmentClinicalEpisodes`) instead of generic "Chunking" (`chunkDocumentEpisodes`).
- Highlight chronological epochs, prescribing cascades, chart lore contradictions, unclosed diagnostic/therapeutic loops, and cross-provider regimen shifts in all clinical syntheses.

### Rule 3: Zero Blind Trust & No Fluff
- Never output an ungrounded clinical claim. Every clinical fact must be verified against source record ID and page numbers.
- Explicitly flag contradictions across time (e.g., specialist diagnostic reports refuting copy-forwarded chart lore) and notable clinical absences (e.g., unclosed post-discharge holds or missing monitoring baselines).
- Never use em-dashes anywhere in copy, UI labels, or documentation. Use colons, commas, parentheses, or separate sentences.
- No fake statistics, no stock novelist names, no stock quotes, no academic enum theater. Show the real clinical mechanism.
