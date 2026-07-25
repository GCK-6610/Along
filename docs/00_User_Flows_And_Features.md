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
* **Filter Mode Switcher**: Segmented control with four toggle tabs:
  1. **By Interest (Default)**: Renders a grid of 6 Category cards:
     - 🏅 **Sports** (active local plans count, medal icon)
     - ☕ **Food & Coffee** (active count, coffee cup icon)
     - 🎭 **Entertainment** (active count, masks icon)
     - 🛍 **Shopping** (active count, bags icon)
     - 🌿 **Outdoor** (active count, leaf icon)
     - 📚 **Learning** (active count, books icon)
  2. **By Time**: Filter sub-tabs: *Happening Now*, *Today*, *Tomorrow*, *This Weekend*.
  3. **Trending**: Lists plans sorted by highest request count and trending tags.
  4. **Nearby**: Launches an interactive map plotting general 200m proximity circles and category emojis.
* **Sponsors Suggestion List (New Feature Layout)**:
  - A horizontal list of **Sponsored Venue Cards** displaying partnerships.
  - **Sponsor Card Structure**:
    - Simple banner image of the venue.
    - Venue Name & Location (e.g., *"Third Wave Coffee, Vasant Vihar"*, *"PlayAll Sports Arena, Gachibowli"*).
    - Basic suggestion details: *"Ideal workspace cafe with high-speed Wi-Fi"* or *"Perfect venue for badminton doubles. Open till midnight."*
* **Suggested Feed**: Personalized matching recommendation cards sorted by semantic similarity score.

---

### Tab 3: ➕ Create Plan (Overlay Studio)
Triggered by tapping the floating center button.
* **State 1: AI NLP Text Input**:
  - A simple text area where the user describes their plan in natural language.
  - *Placeholder*: *"Going to Narsingi Cycle Track tomorrow morning at 6:30 AM. Wanna tag along?"*
  - Action: Tap **Process**.
* **State 2: Autofilled Details Form**:
  - Renders the pre-filled parameters parsed by the AI:
    - **Activity Title**: e.g., *"Morning Run"*
    - **Category Dropdown**: e.g., *"Sports"*
    - **Date & Time Picker**: Pre-set to tomorrow, 6:30 AM.
    - **Location Lookup**: Autocompleted venue address (e.g., *"Narsingi Cycle Track, Hyderabad"*).
  - **Manual inputs left for User confirmation**:
    - **Exact Coordination spot (Locked)**: Input text area details hidden from public view (e.g., *"Meet at the cycle rentals counter. I'll be in blue shorts."*).
    - **Capacity Slider**: Range slider (2 to 20 users).
    - **Vibe Tags**: Selectable interest pills (e.g., *"Intermediate"*, *"Cardio"*, *"Outdoor"*).
    - **Visibility Toggle**: Selector switch between `Public` and `Verified Only`.
* **Action**: Tap **Publish Plan**.

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
* **Header Card**: Cover photo, user avatar with green online badge, display name, blue `Verified` badge check, and home location.
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
