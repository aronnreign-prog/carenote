# Product Foundation Law: Temporal Memory Architecture

This rule is MANDATORY and PERMANENT across all coding, UI, and architectural work.

---

## The Core Product Axiom

**Medical history is NOT a text chunk. It is an evolving graph.**

CareNote exists to solve a single fundamental failure of healthcare AI:
Standard AI tools chop PDFs into isolated text chunks, index them by semantic similarity, and suffer from clinical amnesia. They confuse a 2023 discontinued drug with a 2025 active prescription, lose chronological trajectories, and disconnect specialist orders.

CareNote stores medical facts in **temporal / longitudinal graph memory**:
1. **Temporal Evolution**: Every medical fact (prescription, titration, discontinuation, lab baseline) is anchored in time with valid-from and valid-to boundaries.
2. **Evolving Graph**: Facts accumulate into a single persistent patient graph across months, years, and multiple hospital networks.
3. **Verifiable PaperTrail**: Every claim links directly to its source PDF page and exact quote.

---

## Anti-Generic Rules for Agents

### Rule 1: Never Fall into "Generic Document SaaS" Thinking
- DO NOT treat this app like Google Drive, Dropbox, or a generic PDF chat wrapper.
- Documents are merely raw ingestion sources; the core product asset is the **Patient's Evolving Graph**.
- Never suggest generic file-management features (e.g. "Export folder to zip", "Tag documents", "Categorize by file size").

### Rule 2: Use Longitudinal / Temporal Clinical Vocabulary
- Use **"Clinical Records Timeline"** instead of generic "Documents".
- Use **"Index Clinical Record"** instead of generic "Upload File".
- Use **"Synthesize Longitudinal Briefing"** instead of generic "Generate Document Summary".
- Use **"Temporal Memory Query"** instead of generic "Chat with PDF".
- Highlight chronological epochs, dose titrations, and lab trajectories in all briefing outputs.

### Rule 3: Zero Blind Trust (Always Enforce PaperTrail)
- Never output an ungrounded clinical claim.
- Every clinical fact must be verified against source document and page numbers.
- Explicitly flag contradictions across time (e.g., Doctor A changing what Doctor B prescribed) and notable absences.
