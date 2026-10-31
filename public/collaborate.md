# Evaluate CareNote: Research and Technical Collaboration

> CareNote is a research-stage prototype testing graph-based longitudinal clinical-record review.

CareNote is seeking clinical-informatics, health-data, and graph-research collaborators who can help test whether its patient-specific graph and PaperTrail workflow are useful. There is no external pilot proof or clinical outcome evidence. Participation is a research or design collaboration, not a request for a testimonial.

---

## The question we are testing

Can a patient-specific graph help a knowledgeable reviewer reconstruct changing state, inspect relationships, identify contradictions, and trace claims to source pages across fragmented records?

CareNote currently ingests PDF-derived facts into patient-specific graph memory and retrieves graph entities, dated episodes, and temporal relationships for synthesis or query. It uses encounter dates and temporal metadata returned by the graph service. The application does not maintain explicit valid-time and transaction-time fields for every assertion.

PaperTrail includes a deterministic structural check. It rejects source-backed output when inline claim markers do not match claim records, source-backed claims lack evidence, or a cited record/page anchor is missing or ambiguous in retrieved context. It does **not** establish that the extracted fact is accurate, that a quotation entails a claim, that a contradiction was correctly interpreted, or that a clinical conclusion is safe.

---

## Who We Are Looking to Collaborate With

### 1. Clinical informatics and workflow reviewers
- **Specialties of high relevance:** Geriatrics, Nephrology, Cardiology, Complex Internal Medicine, Rheumatology, and Critical Care Transitions.
- **Your involvement:** 
  - Challenge the task definition and what should count as a failure.
  - Help adjudicate dates, state changes, provenance, conflicts, and uncertainty in a bounded evaluation.
  - Identify which reviewer workflow, if any, deserves a deeper test.

### 2. Patient advocates and care coordinators
- **Your perspective:** You are the real-world frontline navigators who assemble fragmented records from multiple health systems into a coherent picture for families and physicians.
- **Your involvement:**
  - Describe real record-assembly and review problems.
  - Challenge whether graph outputs expose useful evidence or create false confidence.
  - Participate in evaluation design, without sharing identifiable patient data.

### 3. Clinical NLP and graph researchers
- **Your technical focus:** Context graphs, bi-temporal indexing, knowledge graph retrieval, multimodal document parsing, and verifiable citation mechanisms.
- **Your involvement:**
  - Review the graph representation and structural PaperTrail gate.
  - Propose fair tests for chronology, evidence links, contradictions, and abstention.
  - Assess whether any public benchmark genuinely fits the implemented PDF-to-graph workflow.

---

## How to Get Involved

If this problem resonates with you:

1. **Start with a bounded review:** Email `collaborate@carenote.in` with the workflow or methods question you understand and whether you prefer asynchronous review or a conversation.
2. **Data boundary:** Do not send identifiable patient data through public pages or email. Any evaluation data requires appropriate governance, permissions, and explicit scope.
3. **Credit and publication:** Participation is private by default. Public attribution, quotes, institutional affiliation, or publication require separate written permission.
4. **Inspect the implementation:** Read [the architecture notes](https://carenote.in/architecture.md) and [the full technical specification](https://carenote.in/llms-full.txt), including the current limitations.
