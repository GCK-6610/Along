/**
 * Central Feature Flags for Along App
 * Used to safely toggle features between release phases without removing underlying code.
 */
export const FEATURE_FLAGS = {
  /**
   * Smart AI Auto-Fill for Plan Creation (OpenAI gpt-4o-mini parser).
   * Disabled in Phase 1 to ensure zero token costs and fast deterministic UX.
   * Can be toggled to true in Phase 2.
   */
  ENABLE_AI_AUTOFILL: false,

  /**
   * On-device zero-storage ID verification.
   */
  ENABLE_ON_DEVICE_ID_VERIFICATION: true,
};
