# Along Production Launch & Release Configuration Reference

This document serves as the master checklist of all identifiers, domains, emails, API keys, and external service placeholders across the Along codebase that must be reviewed and finalized prior to submitting to the Apple App Store, Google Play Store, or public production domains.

---

## 1. App Identifiers & Store Namespaces

| Configuration | Current Value | File Location | Release Action |
| :--- | :--- | :--- | :--- |
| **iOS Bundle Identifier** | `com.alonghangouts.app` | [app.json](file:///Users/gopalchoudhary/Desktop/codes/Along/app.json#L15) | Update to match company domain convention (e.g. `com.along.app` or `in.along.app`) |
| **Android Package Name** | `com.alonghangouts.app` | [app.json](file:///Users/gopalchoudhary/Desktop/codes/Along/app.json#L30) | Update to match company domain convention |
| **Deep Link URL Scheme** | `along` | [app.json](file:///Users/gopalchoudhary/Desktop/codes/Along/app.json#L5) | Scheme for in-app links (e.g. `along://plan/[id]`). Keep or change if using custom branding |
| **App Name** | `Along` | [app.json](file:///Users/gopalchoudhary/Desktop/codes/Along/app.json#L3) | Display name shown beneath app icon on iOS and Android homescreens |
| **App Slug** | `along` | [app.json](file:///Users/gopalchoudhary/Desktop/codes/Along/app.json#L4) | Expo project identifier on EAS |
| **App Version & Build** | `1.0.0` / `2026.08` | [app.json](file:///Users/gopalchoudhary/Desktop/codes/Along/app.json#L6), [settings.tsx](file:///Users/gopalchoudhary/Desktop/codes/Along/src/app/settings.tsx#L240) | Increment for each TestFlight / Play Store release |

---

## 2. Support, Contact & Placeholder Emails

| Item | Current Value | File Location | Release Action |
| :--- | :--- | :--- | :--- |
| **Support Email (Mailto Link)** | `mailto:tag-along@org.com` | [src/app/settings.tsx](file:///Users/gopalchoudhary/Desktop/codes/Along/src/app/settings.tsx#L183) | Replace with official support mailbox (e.g. `support@along.app` or `help@alonghangouts.com`) |
| **Support Email (Display Text)** | `tag-along@org.com` | [src/app/settings.tsx](file:///Users/gopalchoudhary/Desktop/codes/Along/src/app/settings.tsx#L196) | Replace with official support mailbox display |
| **Support Chat / Help Row** | None (Static row) | [src/app/help.tsx](file:///Users/gopalchoudhary/Desktop/codes/Along/src/app/help.tsx#L45-L54) | Link to live chat (e.g. Crisp/Intercom) or open support email |
| **Venue Partner Placeholder** | `partner@yourvenue.com` | [website/index.html](file:///Users/gopalchoudhary/Desktop/codes/Along/website/index.html#L177) | Input placeholder text for venue partnerships form |

---

## 3. Google Maps & Places API Keys

Google Maps keys are used for venue autocomplete, map rendering, and reverse geocoding.

| Configuration | Current Value | File Location | Release Action |
| :--- | :--- | :--- | :--- |
| **iOS Native Maps Key** | Dev key (`AIzaSyAJm...`) | [app.json](file:///Users/gopalchoudhary/Desktop/codes/Along/app.json#L13) | Create production key in Google Cloud Console; restrict to iOS Bundle ID |
| **Android Native Maps Key** | Dev key (`AIzaSyAJm...`) | [app.json](file:///Users/gopalchoudhary/Desktop/codes/Along/app.json#L27) | Create production key in Google Cloud Console; restrict to Android Package Name + SHA-1 |
| **React Native Maps Plugin Key** | Dev key (`AIzaSyAJm...`) | [app.json](file:///Users/gopalchoudhary/Desktop/codes/Along/app.json#L54) | Keep aligned with iOS Native Maps Key |
| **Places Web Service Key** | Dev env variable | `.env` (`EXPO_PUBLIC_GOOGLE_PLACES_API_KEY`) | Store in EAS Secrets or production environment |

> [!IMPORTANT]
> In Google Cloud Console, lock your production keys with API restrictions: enable only **Maps SDK for iOS**, **Maps SDK for Android**, and **Places API**. Set Application Restrictions to prevent unauthorized usage or quota exhaustion.

---

## 4. Custom Domain & Universal Links (Web-to-App)

When users share hangouts (e.g. `https://along.app/plan/abc-123`), tapping the link should open the Along mobile app directly rather than a browser.

| Configuration | Requirement | Implementation Steps |
| :--- | :--- | :--- |
| **iOS Universal Links** | `apple-app-site-association` | Host JSON file at `https://<YOUR_DOMAIN>/.well-known/apple-app-site-association` with your Apple Team ID and Bundle ID |
| **Android App Links** | `assetlinks.json` | Host JSON file at `https://<YOUR_DOMAIN>/.well-known/assetlinks.json` with your SHA-256 app cert fingerprint |
| **iOS Associated Domains** | `applinks:<YOUR_DOMAIN>` | Add `ios.associatedDomains: ["applinks:<YOUR_DOMAIN>"]` in [app.json](file:///Users/gopalchoudhary/Desktop/codes/Along/app.json) |
| **Android Intent Filters** | `autoVerify: true` | Add `android.intentFilters` for your domain in [app.json](file:///Users/gopalchoudhary/Desktop/codes/Along/app.json) |

---

## 5. App Store & Google Play Legal URLs

Apple App Store (Review Guideline 5.1.1) and Google Play Store policies strictly require publicly hosted web links for consumer apps:

| Document | Recommended Live URL | Notes |
| :--- | :--- | :--- |
| **Privacy Policy** | `https://<YOUR_DOMAIN>/privacy` | Must detail location data usage (15-min proximity radar), camera/photo ID verification, and data retention |
| **Terms of Service** | `https://<YOUR_DOMAIN>/terms` | Mandatory for User-Generated Content (hangout creation, community standards, and chat conduct) |
| **Support / Contact Webpage** | `https://<YOUR_DOMAIN>/support` | Required contact URL for store listings |
| **Account Deletion** | In-app ([settings.tsx](file:///Users/gopalchoudhary/Desktop/codes/Along/src/app/settings.tsx#L223)) | Already implemented via `delete_user_account()` RPC (Apple Guideline 5.1.1(v) compliant) |

---

## 6. Authentication & SMS Gateway (Production +91 Numbers)

| Setting | Location | Release Action |
| :--- | :--- | :--- |
| **Production SMS Provider** | Supabase Dashboard -> Authentication -> SMS Providers | Replace development test gateway with production SMS gateway (Twilio, MSG91, or Fast2SMS) |
| **DLT Registration (India)** | Indian Telecom Portal | Register Along brand headers and SMS OTP message templates for +91 compliance |
| **Supabase Site URL** | Supabase Dashboard -> Authentication -> URL Configuration | Update from `http://localhost:3000` to `https://<YOUR_DOMAIN>` |
| **Redirect URLs** | Supabase Dashboard -> Authentication -> URL Configuration | Ensure `along://*` and `https://<YOUR_DOMAIN>/**` are whitelisted |

---

## 7. Push Notification Credentials

| Platform | Provider | File / Credential | EAS Configuration |
| :--- | :--- | :--- | :--- |
| **Apple (iOS)** | Apple Developer Portal | APNs Authentication Key (`.p8` file, Key ID, Team ID) | Upload via `eas credentials` |
| **Android** | Google Cloud / Firebase Console | FCM v1 Service Account JSON (`google-services.json`) | Upload via `eas credentials` |
| **Backend Dispatcher** | Supabase Edge Function | `SUPABASE_SERVICE_ROLE_KEY` | Set in Supabase Secrets for `send-push-notification` |

---

## 8. AI Parser & Cloud Edge Function Secrets

| Function | Required Secret | Purpose |
| :--- | :--- | :--- |
| `parse-plan-text` | `OPENAI_API_KEY` or `GEMINI_API_KEY` | Powers AI auto-fill when users paste or dictate plan text |
| `verify-id` | `SUPABASE_SERVICE_ROLE_KEY` | Government ID verification and blue-tick badge issuance |
| `send-push-notification` | `SUPABASE_SERVICE_ROLE_KEY` | Relays in-app notifications to Expo Push API |
| `notify-host` | `SUPABASE_SERVICE_ROLE_KEY` | Dispatches instant join request push notifications to hosts |

---

## 9. Pre-Submission Verification Commands

Before deploying production binaries:

```bash
# 1. Verify TypeScript compilation (must return 0 errors)
npx tsc --noEmit

# 2. Run all unit and integration test suites
npm test

# 3. Check for leftover debug logs or forbidden characters
git diff
```
