# AI medical record summarization for longitudinal chart review

AI medical record summarization is most useful when it helps a reviewer understand what changed across a patient's history and verify each important statement against the source record. A short summary is not enough when medications, diagnoses, test results, and follow-up actions change across encounters.

CareNote is exploring a source-grounded approach to longitudinal chart review. It turns fragmented clinical-record PDFs into a patient-specific temporal graph, then produces a synthesis or temporal answer with links to the source record and page. The approach is research-stage and does not establish clinical safety, accuracy, or patient benefit.

## What longitudinal chart review requires

A useful longitudinal review should help the reader answer five questions:

1. What happened, and when?
2. What changed since the earlier encounter?
3. Which findings, treatments, and problems are related?
4. Which claims are supported, conflicting, historical, or still uncertain?
5. What follow-up or conditional action remains undocumented?

These questions are harder than extracting the latest mention of a diagnosis or medication. The reviewer has to distinguish event time from document order, recognize when a later record changes the meaning of an earlier statement, and keep missing documentation separate from a clinical conclusion.

## Why generic AI summaries can lose clinical context

A generic summarizer can produce fluent prose while flattening the history. Common failure patterns include:

- showing a discontinued medication beside an active order without making the state clear;
- repeating a copied-forward problem-list label after a later report challenges it;
- combining events from different encounters without preserving their dates;
- describing a relationship between events without showing the supporting source;
- turning the absence of a documented action into an unsupported recommendation.

The problem is not that every summary is wrong. The problem is that a reviewer may not be able to see which parts are current, which are historical, and which require verification.

## What source-grounded summarization means

Source-grounded summarization keeps the generated account connected to the records that support it. For each material claim, a reviewer should be able to inspect the source document, page, date, and evidence state.

A provenance interface should make verification selective. A 2026 formative usability study of sentence-level provenance for AI-generated longitudinal medical-record summaries used synthetic patient charts and reported that rapid access to supporting evidence mattered for trust calibration during first-pass chart review. Read the [study in JMIR Human Factors](https://humanfactors.jmir.org/2026/1/e95644).

Source links do not make a generated statement true by themselves. They let a reviewer challenge it.

## How CareNote approaches the problem

CareNote currently accepts clinical-record PDFs and extracts facts, dates, encounter information, medications, laboratory values, conditions, and page references. It organizes the extracted encounters into a patient-specific graph and produces a Longitudinal Clinical Synthesis or a Temporal Memory Query.

The intended review surface distinguishes:

- source-record assertions from generated synthesis;
- active, historical, superseded, conflicting, and unresolved states where the record supports that distinction;
- a relationship between events from a clinical conclusion;
- an undocumented follow-up action from a recommendation;
- a source page from an inference that still needs human review.

Its PaperTrail workflow links claims back to the source PDF page. CareNote does not diagnose, recommend treatment, determine what a patient is actually taking, or replace clinical judgment. The current implementation works from uploaded PDFs rather than a direct EHR integration.

## A practical way to evaluate an AI chart-review system

Use a fixed synthetic or appropriately governed de-identified record set. Ask the system and the reviewer to complete the same tasks:

- reconstruct the patient's state at a specified time;
- identify material changes and their dates;
- trace claims to source pages;
- find contradictions without silently resolving them;
- identify unresolved follow-up;
- mark what is supported, ambiguous, conflicting, or undocumented.

Compare the graph-assisted workflow with ordinary document review. Record missed events, unsupported additions, wrong citations, false resolution of contradictions, and false confidence. Do not treat positive reactions as clinical validation.

Recent research resources such as [EHR-ReasonCon on PhysioNet](https://physionet.org/content/ehr-reasoncon/1.0.0/) also reflect the importance of checking consistency across narrative clinical notes and structured records. The benchmark contains expert-guided consistency annotations, but it does not evaluate CareNote and is not presented as evidence for CareNote's performance.

## Questions people ask

### What is longitudinal chart review?

Longitudinal chart review is the reconstruction of a patient's clinical course across records created at different times, by different providers, and often for different purposes. The task includes chronology, changing status, relationships among events, source verification, contradictions, and unresolved work.

### How is this different from AI medical record summarization?

AI medical record summarization usually describes the output format: a generated account of the record. Longitudinal chart review describes the reasoning task: reconstructing changing state and checking the evidence across time. A useful summarizer can support that task, but it should not hide the dates, source pages, uncertainty, or contradictions that make the task difficult.

### Can citations make an AI medical summary safe?

No. Citations make a claim easier to inspect, but they do not prove that the system interpreted the source correctly or included every important event. Source evidence, explicit uncertainty, and human review remain necessary.

### Is CareNote clinically validated?

No. CareNote is a research-stage prototype with no external pilot proof or clinical outcome evidence. It is exploring whether a patient-specific temporal graph can help a knowledgeable reviewer organize and verify fragmented records.

## Continue the research

- Read the [CareNote clinical-record synthesis guide](https://carenote.in/clinical-record-synthesis).
- Read the [CareNote architecture notes](https://carenote.in/architecture.md).
- Read the [CareNote collaboration brief](https://carenote.in/collaborate.md).
- See the [CareNote public proof dossier](https://carenote.in/#proof).

If you work in clinical informatics, clinical NLP, longitudinal chart review, health-data systems, or biomedical knowledge graphs, CareNote is looking for critique of this problem and of what a credible first evaluation should measure.
