---
name: strict-spec-adherence
description: Research-backed guidelines for working with Gemini (and LLMs generally) to minimize the 12 documented coding failure modes. Based on deep research into academic papers, industry tools, and community findings.
---

# Strict Spec Adherence + LLM Failure Mode Mitigations

## The 12 Failure Modes (Quick Reference)

| # | Name | Primary Mitigation |
|---|------|--------------------|
| FM-1 | Optimistic Stubbing | TDD: failing tests gate completion |
| FM-2 | Context Drift | Fresh session per task + spec re-injected every prompt |
| FM-3 | Task Conflation | One task per session + Declare-Execute-Announce checklist |
| FM-4 | Sycophantic Completion | Tests as completion criterion, adversarial reviewer prompt |
| FM-5 | No Self-Verification | Two-pass mandatory: generate in one message, audit in the next |
| FM-6 | Spec Not Re-Read | Full spec injected in EVERY prompt, not just the first |
| FM-7 | Cascading Errors | Integration tests gate between tasks |
| FM-8 | Agentic Drift | Goal anchoring + max_iterations hard stop |
| FM-9 | Action Bias | Explicit file scope constraint in every prompt |
| FM-10 | Silent Semantic Failure | Integration tests with real data, not mocks |
| FM-11 | Version-Drift Doc Trust | Introspect the ACTUAL installed package version before trusting docs; docs from `main`/`latest` often describe a different API than what resolved |
| FM-12 | Blind-Retry Loop | After 2 identical failures of the same approach, STOP and use websearch/docs/introspection; never re-run a build with no code change between attempts |

---

## Rules for This Project

### Rule 1: Never Assume Implied Consent
If the user is deliberating or says they are "thinking about it," DO NOT take action. Wait for an explicit command.

### Rule 2: Do Not Skip Ahead
Implement ONLY the task at hand. Verify all requirements before writing any code.

### Rule 3: Use Provided Prompts & Schemas Exactly
If the spec provides a prompt template, JSON structure, or output format: use it verbatim.

### Rule 4: Write a Plan First When the Spec Says So
If the spec says "write a plan and get approval first": stop, output the plan, and wait for "yes" before writing code.

### Rule 5: Never Accept Stubs in Your Own Code
If you are about to write a comment like "// in production we'd call X", STOP. Either implement it or tell the user you cannot and ask for guidance.

### Rule 6: Two-Pass Rule
Never audit your own code in the same message you wrote it. Implementation goes in one message, spec-comparison audit goes in the next separate message.

### Rule 7: Inject the Spec Every Time
Do not rely on scroll-back or "memory." The relevant spec section must be explicitly read before every coding action.

### Rule 8: Document Mistakes
When a mistake is caught (by the user or self-audit), document the root cause so it is not repeated.
