# Test CareNote's graph approach to longitudinal clinical memory

CareNote is looking for a small number of US clinical-informatics and health-tech builders to evaluate one narrow problem in temporal clinical memory.

This is a research collaboration, not a request to endorse a finished clinical product. We are testing whether a patient-specific graph can help a knowledgeable reviewer reconstruct changing clinical state across fragmented records and inspect the evidence behind the reconstruction.

## The problem we are testing

Clinical records are written at different times by different people and services. A useful review may need to distinguish:

- what was active at a given point in time
- what was held, stopped, or superseded
- how a medication, finding, symptom, or diagnosis changed across encounters
- which records support or contradict a claim
- which follow-up action remains unresolved
- which source record and page support the conclusion

CareNote currently extracts clinical facts and page references from medical-record PDFs, organizes encounters into a patient-specific graph, and produces a longitudinal synthesis or a temporal answer with visible evidence states. The graph is the approach we want to test. We do not yet have external pilot proof that it improves clinical review.

## The first evaluation question

Can CareNote preserve active versus superseded clinical state across fragmented, multi-provider records and show the supporting pages?

The task set may also examine:

- a treatment change followed by a symptom and a follow-on prescription
- a diagnosis repeated in later notes but challenged by a diagnostic report
- a conditional medication hold whose stated threshold is later met
- an important follow-up action that remains undocumented

The point is not to demonstrate that every output is correct. The point is to learn where the graph and evidence trail help, where they fail, and which distinctions matter to people who review complex longitudinal records.

## What participation looks like

The initial collaboration is bounded and can begin asynchronously:

1. Receive a short written brief describing the system, the evaluation question, and its limits.
2. Review the current evaluation experience and a fixed task packet of five to ten cases.
3. Use the supplied public demonstration, synthetic records, or appropriately de-identified and authorized records.
4. Compare CareNote's output with the source records and record what was correct, partial, unsupported, unclear, or missing.
5. Complete a short written review of what worked, what failed, and what should be tested next.

A working conversation is available, but a presentation is not required. The evaluation can stay primarily written and asynchronous.

## Who this is for

We are looking for people who understand at least one of these areas:

- clinical informatics and longitudinal chart review
- clinical data systems and health-tech development
- biomedical or temporal knowledge graphs
- evidence-grounded AI for healthcare
- complex internal medicine, geriatrics, nephrology, cardiology, or care transitions

The right collaborator does not need to agree with the graph approach. We want people who can challenge it precisely.

## What CareNote does and does not claim

CareNote can organize record evidence, connect events across time, produce a longitudinal synthesis or temporal query, and link material claims to source records and pages for review.

CareNote does not diagnose, recommend treatment, determine what a patient is actually taking, replace formal medication reconciliation, assign responsibility for follow-up, or make a clinical decision. The evaluation is not a clinical validation study, production pilot, or outcomes study.

We are not claiming clinical outcomes, regulatory authorization, compliance certification, perfect extraction, zero hallucinations, enterprise readiness, direct EHR integration, or autonomous clinical use.

## Data boundary

Use the public demonstration, synthetic records, or appropriately de-identified and authorized materials. Do not send identifiable protected health information through the intake or evaluation. Any work involving real institutional data requires the appropriate approvals, agreements, security review, access controls, and retention terms before access is granted.

Participation is private by default. Public credit, quotes, logos, case studies, or publication require separate written permission.

## Start with one research question

If this problem is close to your work, request a focused collaboration through the [CareNote demo intake](https://carenote.in/#demo) or email collaborate@carenote.in. Tell us what kind of records or workflow you understand and whether you prefer a written asynchronous evaluation or a working conversation.

The useful outcome is not a flattering demonstration. It is a clearer answer to whether graph-based temporal clinical memory helps a real reviewer make sense of a fragmented record.