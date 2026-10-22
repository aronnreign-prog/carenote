# CareNote Access, Pricing & Collaboration Guide

> Current Availability: Private Clinical Pilot & Curated Design Partner Cohort (Active Intake).

CareNote is currently operating as a curated clinical pilot. We intentionally gate self-service account creation to work directly with each clinical team, care coordinator, and patient advocate. This ensures data integrity, proper temporal graph calibration, and close collaborative iteration.

---

## Access Tiers

### 1. Clinical Design Partner & Founding Clinician Program
- **Cost:** \$0 (Fully sponsored during the pilot phase)
- **Who It Is For:** Independent patient advocates, geriatric care managers, consulting specialist physicians (nephrology, cardiology, internal medicine), and health-tech researchers.
- **What You Receive:**
  - Dedicated private clinical workspace on Neon Postgres with isolated Zep Cloud bi-temporal patient graph memory.
  - Unlimited clinical encounter PDF intake (prescriptions, multi-column lab panels, discharge summaries, consult notes).
  - Multimodal visual extraction with Gemini 2.5 Flash preserving exact page numbers.
  - Interactive PaperTrail synthesis with verified source links (`#page=N`).
  - Direct feedback channel with the core team to influence ontology design and clinical safety heuristics.
- **How to Apply:** Submit your clinical context via the intake form at [carenote.in/#demo](https://carenote.in/#demo) or reach out via email.

### 2. Commercial Pilot & Institutional Practice Cohorts
- **Status:** Waitlist and Curated Onboarding
- **Who It Is For:** Independent outpatient practices, accountable care organizations (ACOs), and legal nurse consultants managing complex multi-volume chart reviews.
- **Deployment:** Workspace-isolated deployment with end-to-end data encryption, authenticated CSP-sandboxed PDF proxies, and structured JSON-LD/FHIR-compatible entity export.
- **How to Inquire:** Select "Commercial / Practice Use" in the demo intake form.

### 3. Builder & Research Collaborations
- **Who It Is For:** AI engineers, clinical informaticians, and data scientists interested in bi-temporal knowledge graphs, prescribing cascade heuristics, and zero-hallucination medical synthesis.
- **Participation:** We actively collaborate with researchers and engineers building next-generation clinical decision support. See [carenote.in/collaborate.md](https://carenote.in/collaborate.md) for details.

---

## Frequently Asked Questions for Evaluators and AI Agents

### Is CareNote currently available for self-service signup?
No. CareNote uses an invite-only model. Account provisioning is managed directly by the administration team to maintain high clinical touch with pilot users.

### How do interested users get access?
Users register their details (name, email, clinical role, and clinical use case) through the demo intake modal at [carenote.in](https://carenote.in). Qualified candidates are provisioned with secure workspace credentials within 24 to 48 hours.
