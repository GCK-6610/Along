# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v58.0.0/ before writing any code.

---

# Strict AI Token Usage Guardrails

1. NEVER invoke, test, or trigger live OpenAI/GPT APIs or Edge Functions that burn paid tokens without direct, explicit permission from the Founder in the conversation.
2. Paid AI tokens are ONLY authorized for the one-time user identity verification check (`verify-id`). All other features must use deterministic local code or standard database queries.
3. Verification token optimization: `gpt-4o-mini` with `detail: "low"` and `max_tokens: 150`.

