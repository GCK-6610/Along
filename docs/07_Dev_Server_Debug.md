*2026-07-31*: Fixed stray comma in verify.tsx; updated quick start.

# Server Startup & Debugging Guide

## Goal
Document the common commands for starting the Expo dev server, handling port conflicts, and debugging a blank preview screen. This file will be kept up‑to‑date after each iteration.

## Quick Start (updated)
```bash
# Ensure no lingering process on the Expo ports
bash -c "kill $(lsof -ti:8081,8082) 2>/dev/null || true"

# Launch the dev server – the recent fix removes a stray comma that caused a build failure
npx expo start --web --clear --port 8082
```

## Common Issues & Fixes
1. **Blank preview screen**
   - Ensure the server is running (`http://localhost:8082`).
   - Verify the `<iframe>` `src` in `preview.html` points to the correct port.
   - Check server logs for errors (`cat .system_generated/tasks/<latest-task-id>.log`).
2. **Port conflicts**
   - Use the kill command above or change the port with `--port <new>`.
3. **Missing `zsh`**
   - If `/bin/zsh` is unavailable, set the shell before running:
     ```bash
     export SHELL=$(which bash)
     npx expo start --web --clear --port 8082
     ```

## Debugging Steps
```bash
# 1. List processes using the ports
lsof -i :8081
lsof -i :8082

# 2. View server logs (replace <task-id> with the actual ID)
cat .system_generated/tasks/<task-id>.log

# 3. Reload the iframe in preview.html
# Click the "Reload" button or run:
open http://localhost:8082
```

## UI & Web Flexbox Layout Guidelines
1. **Preventing Input Box Overflow**
   - React Native Web renders `<TextInput>` as standard HTML `<input>` elements.
   - HTML inputs have default browser `min-width` rules inside flex containers.
   - **Mandatory Rule**: Any `<TextInput>` in a flex row must specify `minWidth: 0` and `flexShrink: 1`.
   - Any fixed-size sibling badges (e.g. `countryCode` `🇮🇳 +91`) must specify `flexShrink: 0`.
   - Flex containers must declare `width: '100%'` and `maxWidth: '100%'`.

## Updating this Document
After any iteration that changes the startup commands or UI layout rules, prepend a short note at the top with the date and a one‑line summary of the change.

---
*Last updated: 2026-07-31 (Fixed Web Flexbox Input Overflow)*
