# Along Workspace Rules - Task Debate & Approvals

All tasks in this repository must undergo a rigorous peer-review and debate workflow representing the core stakeholders of Along. No code changes, modifications, or remote pushes should be performed until this consensus workflow is complete.

---

## The Core Stakeholder Roles

1. **Product Manager (PM)**:
   - Focuses on user alignment, tag-along philosophy boundaries, user stories, and the North Star metric (**Completed Plans**).
   - Ensures no "feature bloat" occurs.

2. **Senior Software Engineer (SE)**:
   - Focuses on architecture scaling, PostGIS geospatial query efficiency, database integrity, schema rules, security boundary compliance, and API performance.

3. **UI/UX Engineer**:
   - Focuses on brand styling tokens (HSL colors, Outfit/Inter typography), screen layout consistency, interactive states, and pixel-perfect Figma mockups alignment.

4. **Entrepreneur (Founder)**:
   - Focuses on business loops, growth engines, sponsor card listings, time-to-market trade-offs, and final approval for deployment.

---

## Mandatory Work Pipeline for Any Task

1. **Debate Phase**: When a task is requested, the agent must output a structured discussion detailing opinions from the **PM**, **SE**, **UI/UX Engineer**, and the **Entrepreneur**. 
   > [!IMPORTANT]
   > This debate should only occur in the chat conversation / thought process. The final committed or created markdown documentation files (`.md` files) must NOT contain the simulated stakeholder conversation transcript or dialogue quotes. They must be written as clean, formal, professional technical specifications.
2. **Consensus Implementation Plan**: The team aggregates their debate into a unified technical implementation plan.
3. **Founder Approval (CRITICAL)**: 
   - **No code changes or `git push` command execution is allowed before the user/founder explicitly reviews and approves the plan.**
   - The user must give direct clearance before any changes are committed or pushed to the GitHub repository.

---

## Strict AI Token Usage & Development Guardrails (MANDATORY)

1. **Explicit Founder Permission Required**:
   - The AI agent must NEVER invoke, test, or trigger live OpenAI/GPT APIs or Edge Functions that burn paid tokens without direct, explicit permission from the Founder in the conversation.
   - All automated unit tests (`npm test`, Jest test suites) must run exclusively on mocks/stubs and must NEVER hit paid AI endpoints.

2. **Single Authorized AI Use-Case**:
   - In Along, paid AI tokens are ONLY authorized for the one-time user identity verification and human presence check (`verify-id`).
   - All other features (plan parsing, recommendations, notifications, moderation) must use deterministic local code, PostgreSQL queries, or standard algorithms. No AI token burn is allowed for non-verification tasks.

3. **Verification Token Optimization & Scalability Standards**:
   - **Model & Detail**: Use `gpt-4o-mini` with `detail: "low"` (strictly 85 tokens per image).
   - **Output Token Cap**: Must set `max_tokens: 150` in the completion request to prevent token overspending.
   - **Client-Side Compression**: Captured ID and selfie images must be compressed client-side (quality 0.65) before base64 encoding to minimize network payload, latency, and memory.
   - **Zero Storage**: Images are processed ephemerally in-memory and immediately destroyed.


