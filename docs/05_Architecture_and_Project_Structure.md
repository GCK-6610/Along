# 05 Architecture & Project Structure

## Overview
This document outlines the file structure and architectural boundaries for the production deployment of Along. The repository is structured as a monorepo containing both the React Native (Expo) frontend and the Supabase backend configuration.

## 1. Root Directory Structure

```text
/Along
├── docs/                   # Engineering specifications & design docs
├── prototype/              # The initial React/Vite web prototype (DO NOT MODIFY)
├── supabase/               # Backend logic and infrastructure as code
│   ├── functions/          # Deno-based Edge Functions (e.g., parse-nlp)
│   ├── migrations/         # SQL migration files for Postgres schema
│   ├── seed.sql            # Local development seed data
│   └── config.toml         # Supabase CLI configuration
├── src/                    # React Native (Expo) Source Code
│   ├── app/                # Expo Router (File-based routing)
│   │   ├── (auth)/         # Login/Signup flow
│   │   ├── (tabs)/         # Main app tabs (Home, Explore, Create, Messages, Profile)
│   │   └── _layout.tsx     # Root navigation layout
│   ├── components/         # Reusable UI components
│   │   ├── ui/             # Generic buttons, inputs, modals (styled with Design Tokens)
│   │   └── features/       # Feature-specific components (e.g., PlanCard, MapPin)
│   ├── hooks/              # Custom React hooks (e.g., useLocation, useSupabaseAuth)
│   ├── lib/                # Third-party integrations (Supabase client, Maps SDK)
│   ├── styles/             # Design Tokens & Stylesheets mapped from prototype
│   │   └── theme.ts        # HSL colors, typography, spacing
│   └── types/              # TypeScript interfaces (Database schema types)
├── app.json                # Expo configuration (bundle identifiers, permissions)
├── package.json            # Node.js dependencies
└── README.md               # Project overview
```

## 2. Design System Translation

The visually striking design from the web `prototype` must be translated to React Native carefully:

- **Styling Method**: We will use React Native's built-in `StyleSheet` along with a centralized `theme.ts` file to manage our HSL colors and typography.
- **Micro-Animations**: We will leverage `react-native-reanimated` for smooth hover states (scaled press states) and layout transitions.
- **Glassmorphism**: We will use `@react-native-community/blur` (or Expo's BlurView) to replicate the blurred overlay effects on map sheets and bottom tabs.

### Example `theme.ts` mapping:
```typescript
export const theme = {
  colors: {
    background: '#0F172A', // Map to var(--background)
    primary: '#6366F1',    // Map to var(--primary)
    text: '#F8FAFC',       // Map to var(--text)
  },
  typography: {
    fontFamily: 'Outfit_400Regular',
    heading: 'Outfit_700Bold',
  }
}
```

## 3. Strict Boundary Rules

1. **Prototype Isolation**: Code in `/prototype` is for reference only. Do not link or import from it into `/src`.
2. **Backend Logic**: Complex business rules (like proximity checks or safety guardrails) MUST live in `/supabase/functions` or Postgres RPCs, never in the frontend `/src` to avoid client-side manipulation.
3. **API Keys**: All keys (Supabase Anon, Google Maps API) must be stored in `.env` and loaded via Expo Constants or `process.env`. Never hardcode keys in `app.json` or source files.
