# Along - User Flows & Features Reference Guide

Welcome to the Along development and product specification directory. This document outlines the complete user flows, tab configurations, layouts, and feature specifications for Along, framed around the platonic, action-oriented **"Tag-Along / Personal Intent"** philosophy.

---

## 1. Product Philosophy: The "Tag-Along" Concept

Along is a utility that connects people through shared daily plans. The core concept is:

> **"I am doing X, at time Y, at venue Z. Who wants to tag along?"**

Instead of large community meetups or dating pressure, the platform enables casual, micro-group plans of 2–4 people.

### Role Definitions
* **Initiator**: The person posting their intention (e.g., *"Going running at Narsingi Cycle Track tomorrow morning"*).
* **Joiner**: The person applying to tag along with the Initiator.

---

## 2. App Structure: Tab-by-Tab Feature Reference

Along uses a five-element bottom navigation bar layout. Here is the exact feature list and UI structure of each tab:

```
┌─────────────────────────────────────────────────────────┐
│  [🏠 Home]   [🔍 Explore]   [ ➕ ]   [💬 Chat]   [👤 Profile]  │
└─────────────────────────────────────────────────────────┘
```

### Tab 1: 🏠 Home (The Live Feed)
The primary screen for immediate social discovery.
* **Header Bar**:
  - Proximity location selector (e.g., *"📍 New Delhi, India"*).
  - Notification Bell icon with red unread badge counters.
* **Search & Filter Row**:
  - Keyword search input field (*"Search activity or location..."*).
  - Filter setup icon (toggles custom distance & capacity sliders).
* **Category Pills (Horizontal Scrollbar)**:
  - Quick-toggle tags: `All` (default selected), `Badminton`, `Running`, `Shopping`, `Outdoor`, `Learning`.
* **"Happening Near You" Carousel (Horizontal Cards)**:
  - Shows cards for local intents starting within the next 2 hours or within 1km.
  - Displays: Plan title, tags, rating (e.g., *"★ 4.8"*), host name/photo, timing, spots progress bar (e.g., `2/4 spots filled`), and a coral **Join** button.
* **"Active Nearby" Row**:
  - Horizontal scroll of online user avatars within a 2km radius.
  - Displays: User photo with a green active indicator dot, name, and current interest tag (e.g., *"Kiran B. • Yoga"*, *"Divya N. • Yoga"*).
* **"More Activities" List (Vertical Stack)**:
  - Cards for plans further away or later in the week.
  - Displays a thumbnail image, title, general venue name, relative time status, and a **Join** (coral fill) or **Joined** (green outline badge) status tag.

---

### Tab 2: 🔍 Explore (Discovery & Sponsored Suggestions)
The portal for search exploration, categorizations, and sponsored venue recommendations.
* **Filter Mode Switcher**: Segmented control with four toggle tabs in the following priority:
  1. **Trending (Default)**: Lists plans sorted by highest request count and trending tags.
  2. **By Interest**: Renders a grid of 6 Category cards (Sports, Food & Coffee, Entertainment, Shopping, Outdoor, Learning).
  3. **Map / Nearby**: Launches an interactive map displaying two layers:
     - **Active Plans**: Obfuscated 200m circular proximity markers. Clicking opens the request-to-join card.
     - **Partner Hotspots**: Coordinates pins for Starbucks, arenas, malls. Clicking pins opens a sponsored detail card with a direct shortcut: `[ Host Here ⚡ ]`.
     - *Filter Toggles*: Floating checkbar pills enabling users to show/hide plans vs. hotspots.
  4. **By Time**: Filter sub-tabs: *Happening Now*, *Today*, *Tomorrow*, *This Weekend*.
* **Sponsors Suggestion List (Sticky across all sub-tabs)**:
  - Rendered directly below the filter segmented tabs control.
  - Keeps partner venue recommendations visible when switching between Trending, Map, Interest, or Time views.
  - Tapping a suggestion card opens the Create Form pre-filled with the sponsor location details.

---

### Tab 3: ➕ Create Plan (Overlay Studio)
Triggered by tapping the floating center button.
* **Primary View: Intent Creation Form**:
  - Renders the details input fields for manual configuration:
    - **Activity Title**: e.g., *"Morning Run"*
    - **Category Dropdown**: Includes core options (Running, Badminton, etc.) and a dedicated **🏷️ Other (Custom)** category allowing users to input any custom category name to prevent layout restrictions.
    - **Date & Time**: Calendar/schedules picker.
    - **Location Map Verification**: Tapping the location search autocomplete pins the venue coordinates on an interactive **mini-map verification widget**, showing a draggable pin marker so hosts can align coordinates accurately.
    - **Exact Coordination spot (Locked)**: Secret details hidden from public view (e.g., *"Meet at the cycle rentals counter."*).
    - **Gender Reach Selector**: Allows hosts to restrict plan visibility:
      - `Open to Everyone` (all genders can view and request).
      - `Same Gender Only` (males-only if hosted by a male, females-only if hosted by a female).
      - *Safety Guardrail*: Men are strictly blocked from selecting the "Females Only" visibility configuration.
    - **Verification Toggle**: Selector switch between `Public` (Everyone) and `Verified Only` (Identity Match Badge).
  - **NSFW Safety Filter**: All text fields (Title, Venue, Spot) run through an automated profanity/NSFW text filter to block vulgarity and offensive language.
* **Secondary View: Fill with AI [Secondary]**:
  - An optional toggle card at the top of the form: `Fill with AI ⚡`.
  - Opens a text input prompt where the user describes the plan (e.g., *"Going to run Narsingi Cycle track tomorrow at 6:30am, who wants to join?"*).
  - Tapping **Parse** extracts the parameters, populates the fields, runs safety/NSFW audits, and returns the user to the Primary Form.

---

### Cold Start & Empty State Architecture
When a category or search region has zero active plans, Along prevents blank views by triggering automated placeholder components:
1. **Be the First CTA**: Displays an active button inviting users to post: `[ ➕ Create First Plan ]`. Tapping it pre-fills the creation form with the active filter parameters.
2. **Sponsor Hotspot Templates**: Displays pre-set sponsored template intents (e.g., *"Doubles Badminton Match @ Siri Fort"* or *"Coffee Chat @ Starbucks"*). Tapping a template automatically opens the creation form pre-filled with the sponsor's location, time, and coordinates to streamline the hosting pipeline.



---

### Tab 4: 💬 Chat / Inbox (Messaging Center)
* **Inbox Message List**: Rows showing active plans the user has initiated or joined. Displays plan title, host avatar, latest text snippet, timestamp, and unread count badges.
* **Ephemeral Chat Room**:
  - **Header Info**: Displays plan title, venue address, and timing.
  - **Locked Info Box**: Reveals the exact coordination details once accepted.
  - **Chat Log**: Real-time message exchange stream.
  - **GPS Check-in Widget**: Slides down at the top of the chat 2 hours prior to the plan, showing the user's distance from the venue and a green **Check-in** button.

---

### Tab 5: 👤 Profile (User Identity Passport)
* **Header Card**: Cover photo, user avatar (pre-selected illustration emoji/vector avatar in Phase 1, with options to upload custom photos in V2) with green online badge, display name, blue `Verified` badge check, and home location.
* **Avatar Configuration**: An inline selection tray enabling users to choose from standard vector illustration avatars (fox, panda, lion, tiger, koala, frog, etc.) or opt-in to custom image uploads in future versions.
* **Stats Row**: Three numeric blocks displaying count of plans `Hosted`, `Joined`, and unlocked `Badges`.
* **Interests List**: Color-outlined capsule chips indicating hobbies (e.g., Running, Coffee, Books).
* **Badges Grid**: Displays the user's earned badges in high-contrast icons:
  1. `Identity Verified`: Verified government ID / selfie.
  2. `Early Adopter`: Registered in the initial app launch phase.
  3. `Active Organizer`: Hosted 5+ plans that reached completion state.
  4. `Fitness Enthusiast`: Participated in 5+ physical or sports plans.
  5. `Coffee Lover`: Participated in 5+ coffee or dining plans.
  6. `First Plan`: Completed their first plan on the app.
* **Intents History Tabs**: Toggle slider between:
  - **Upcoming Plans**: List cards for active plan commitments.
  - **Past Plans**: Archive displaying past meets (e.g., *"IKEA Run"* on Sat, *"Aravalli Sunrise Hike"* on Sun).

---

## 3. Core App Flows (Step-by-Step)

Here are the functional workflows explaining how events start, who creates what, and how things proceed:

### Flow 1: Authentication & Profile Setup
1. User enters their phone number.
2. System sends a 6-digit verification code via SMS.
3. User verifies code to authenticate.
4. If a new user, they fill in their Basic Profile (Display Name, DOB, Bio, Avatar, Interests).
5. User is prompted to complete optional **Identity Verification** (ID document + selfie check) to earn the **Identity Verified** badge.
6. Onboarding completes, launching into the main Explore Feed (Home Tab).

### Flow 2: Plan Creation Flow (Initiator)
1. **Initiator** taps the floating `+` button.
2. They enter a description in the AI text area: *"Going shopping and movie this Wednesday at Sarath City Capital Mall, 5pm. Down for Zara and a show."*
3. AI parses the text and pre-fills the form with title, category, date/time, and mall venue.
4. Initiator confirms the parsed details, inputs the exact coordination details (*"Meet outside Zara (G Floor). Row H, seats 14-15."*), sets the capacity limit, and taps **Publish**.
5. The plan is written to the database and becomes discoverable in the area.

### Flow 3: Joining & Matching Flow (Joiner)
1. **Joiner** opens the explore/home feed and filters by interest or locations.
2. They tap the plan card and read the description, host profile verification, and ratings.
3. Joiner taps **Request to Join** and writes a mandatory note: *"Hey! I'm planning to buy some winter wear from Zara, would love to tag along and catch the movie."*
4. Initiator receives a notification, reviews the joiner's profile/ratings, and taps **Accept**.
5. The joiner is notified, the plan-bound chat room opens, and the exact coordination details are revealed.

### Flow 4: Meeting & Verification Flow
1. On the day of the plan, the matched users coordinate in the group chat (*"Just parked, heading up"*).
2. 2 hours before the start time, the **Check-in** button activates.
3. When users arrive at the venue, they tap **Check-in**. The system verifies their device GPS is within 100 meters of the venue.
4. Once check-ins are verified, the plan transitions to the **Completed** state.

### Flow 5: Feedback & Review Flow
1. 1 hour after the plan's end time, users receive prompts to review their experience.
2. Users rate each other (1-5 stars) and select badge tags (e.g. `Fitness Enthusiast` or `Coffee Lover`).
3. The system calculates and updates their Profile ratings and badges.
4. 24 hours after completion, the chat room changes to **Read-Only**.
5. 7 days after completion, all chat messages are purged for database privacy.
