# Along - UI/UX Design System & Layout Specifications

This document defines Along's visual guidelines, layout wireframes, color systems, typography tokens, and provides live links/embeds to our Figma design file.

---

## 🔗 Live Figma Designs

You can view, comment on, and extract layout assets from the active design file:

* **Figma File URL (Direct)**: [Figma Design Canvas](https://figma.com/make/grZ22ql1tzGjbXRWHIPAso/Meetup-App-UI-Design?t=yQ1PLw6iaMPNtIT1-0)

> [!NOTE]
> If the live embed below displays "File not found" or "Access Denied," please make sure the file share permissions in your Figma editor are set to **"Anyone with the link can view"** (click the **Share** button in the top-right of your Figma screen).

### Interactive Live Embed
If your markdown editor supports HTML rendering, the live Figma viewport will render below:

<iframe style="border: 1px solid rgba(0, 0, 0, 0.1); border-radius: 12px; background: #2C2C2C;" width="100%" height="600" src="https://www.figma.com/embed?embed_host=share&url=https%3A%2F%2Ffigma.com%2Fmake%2FgrZ22ql1tzGjbXRWHIPAso%2FMeetup-App-UI-Design%3Ft%3DyQ1PLw6iaMPNtIT1-0" allowfullscreen></iframe>

---

## 1. Visual Identity & Brand Tokens

Along uses a warm, high-contrast light base matched with a vibrant coral-red brand color and green verification states. This creates a clean, premium, and friendly user environment.

### A. Color System
* **Brand Primary (Coral Red)**: `hsl(355, 100%, 63%)` — Used for active icons, buttons (Join, Create), and navigation focus indicator.
* **Success/Online (Emerald Green)**: `hsl(150, 84%, 38%)` — Used for verified checkmarks, check-in success badges, online avatar indicators, and "Joined" tags.
* **Background Canvas (Warm Light Grey)**: `hsl(0, 0%, 97%)` — The overall app background.
* **Surface Layer (Clean White)**: `hsl(0, 0%, 100%)` — White card backgrounds, dialogs, and navigation sheets.
* **Typography Slate**:
  - **Primary Text (Deep Charcoal)**: `hsl(220, 24%, 10%)`
  - **Secondary Text (Slate Grey)**: `hsl(220, 10%, 45%)`
  - **Muted Placeholders**: `hsl(220, 8%, 65%)`

### B. Typography
* **Header Font Family**: **Outfit** (`Outfit, sans-serif`) — Modern, rounded geometric sans-serif for screen titles, headings, and numbers.
* **Body Font Family**: **Inter** (`Inter, sans-serif`) — High-readability neutral sans-serif for chat logs, bios, inputs, and descriptions.

---

## 2. Bottom Navigation Bar Layout

Along's main interface displays five bottom buttons. Tapping a button switches the screen viewport:

```
┌─────────────────────────────────────────────────────────────────┐
│   [🏠 Home]    [🔍 Explore]    [ ➕ ]    [💬 Chat]    [👤 Profile]  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Screen Specifications & Layout Wireframes

### Screen 1: 🏠 Home Dashboard
The landing feed showcasing active local tag-along opportunities.

```
+-------------------------------------------------------+
|  GOOD MORNING 👋                                (3)   |
|  Find your partner                             [🔔]   |
|                                                       |
|  [ Q Search activity or location... ]     [ Coral  ]  |
|                                           [ Filter ]  |
|  📍 New Delhi, India                                  |
|                                                       |
|  ( All )   ( Badminton )   ( Running )   ( Shopping ) |
|                                                       |
|  ⚡ Happening Near You                      See all >  |
|  +--------------------+   +--------------------+      |
|  | [Image: Badminton] |   | [Image: Clothing]  |      |
|  | Morning Badminton  |   | Weekend Mall Run   |      |
|  | Siri Fort Complex  |   | Select Citywalk    |      |
|  | Arjun M.   [Join]  |   | Priya S.   [Join]  |      |
|  | 2/4 spots [======] |   | 1/3 spots [===]    |      |
|  +--------------------+   +--------------------+      |
|                                                       |
|  👥 Active Nearby                           See all >  |
|    ( O )       ( O )       ( O )       ( O )          |
|   Kiran B.    Divya N.   Aakash P.   Sneha M.         |
|  Badminton      Yoga      Running    Shopping         |
|                                                       |
|  ✨ More Activities                                    |
|  +-------------------------------------------------+  |
|  | [Img] 5K Dawn Run                      ★ 4.9    |  |
|  |       📍 Lodhi Gardens                          |  |
|  |       📅 Today, 6:00 AM  •  4 left              |  |
|  |       👤 Rohan K.                  [✔ Joined]   |  |
|  +-------------------------------------------------+  |
|  | [Img] Sunrise Yoga Flow                ★ 4.7    |  |
|  |       📍 India Gate Lawns                       |  |
|  |       📅 Sun, 6:30 AM  •  5 left                |  |
|  |       👤 Meera T.                  [✔ Joined]   |  |
|  +-------------------------------------------------+  |
+-------------------------------------------------------+
```

* **Active Nearby Avatars**: Row of circle images. Green dot in top-right indicates online. Directly below is the Display Name in black and their current interest tag in red.
* **Availability Progress Bar**: The red/coral bar at the base of the card visualizes spots left (e.g. `2/4 spots` shows half full).
* **Joined Badge**: Green pill with a checkmark indicating accepted state.

---

### Screen 2: 🔍 Explore Screen
For structured searches and sponsored venue listings.

```
+-------------------------------------------------------+
|  Explore                                              |
|  Discover what's happening around you                 |
|                                                       |
|  [ Q Search by plan, place, or interest... ]          |
|                                                       |
|  [ By Interest ]   [ By Time ]   [ Trending ]  [Nearby] |
|                                                       |
|  +---------------------+   +---------------------+    |
|  | 🏅 Sports           |   | ☕ Food & Coffee    |    |
|  | 24 active plans     |   | 18 active plans     |    |
|  +---------------------+   +---------------------+    |
|  | 🎭 Entertainment    |   | 🛍️ Shopping         |    |
|  | 12 active plans     |   | 9 active plans      |    |
|  +---------------------+   +---------------------+    |
|                                                       |
|  🎁 Featured Sponsors                                 |
|  +--------------------+   +--------------------+      |
|  | [Sponsor Image]    |   | [Sponsor Image]    |      |
|  | PlayAll Arena      |   | Starbucks Cafe     |      |
|  | "Perfect court venue|  | "Ideal workspace   |      |
|  | for badminton"     |   | with fast Wi-Fi"   |      |
|  +--------------------+   +--------------------+      |
|                                                       |
|  Suggested for You                                    |
|  +-------------------------------------------------+  |
|  | Badminton Doubles — Need Two                    |  |
|  | 📍 Siri Fort Complex • 1.2km                    |  |
|  | 📅 Starts in 40 min  •  2 spots left            |  |
|  +-------------------------------------------------+  |
+-------------------------------------------------------+
```

* **Sponsor Cards List**: A horizontal list of cards containing a venue photo, business name, and recommendation details. Tapping search filters plans automatically to that venue.

---

### Screen 3: ➕ Create Plan Screen (Primary Form with Secondary AI)

Triggered via the bottom navigation red floating button. The manual details form is presented by default.

```
+-------------------------------------------------------+
|  Create a Plan                                     [X] |
|                                                       |
|  +-------------------------------------------------+  |
|  | 💡 Got a quick draft?                           |  |
|  | Let AI parse your details automatically.        |  |
|  |                               [ Fill with AI ⚡ ]|  |
|  +-------------------------------------------------+  |
|                                                       |
|  Activity Title:                                      |
|  [ Morning Cycling                                 ]  |
|                                                       |
|  Category:                   Scheduled Time:          |
|  [ Sports          ] ▼       [ Tomorrow, 6:30 AM   ]  |
|                                                       |
|  Venue Location:                                      |
|  [ Narsingi Cycle Track, Hyderabad                 ]  |
|                                                       |
|  🔒 Exact Meeting Spot (Only shown to accepted joiners):|
|  [ Meet at the cycle rentals desk. Wearing red cap.]  |
|                                                       |
|  Capacity: 4 slots [=============o                 ]  |
|                                                       |
|  Visibility:  (x) Public  ( ) Identity Verified Only  |
|                                                       |
|  [ Publish Tag-Along Intent ]                         |
+-------------------------------------------------------+
```

*Note: Clicking `[ Fill with AI ⚡ ]` opens the secondary text input dialog (Stage 2) where the user types a raw plan description, clicks `Parse`, and returns to this form prefilled.*


---

### Screen 4: 💬 Chat / Inbox Screen
Shows active chat rooms. The ephemeral chat room has a top widget containing coordinate secrets and check-in:

```
+-------------------------------------------------------+
|  ◄  Morning Cycling Group Chat                        |
|     Narsingi Cycle Track • 6:30 AM                    |
+-------------------------------------------------------+
|  🔒 COORDINATION SPOT UNLOCKED                        |
|  "Meet at the cycle rentals desk. Wearing red cap."   |
|                                                       |
|  GPS Check-In: [ Distance: 20m ]      [ Check-In ✔ ]  |
+-------------------------------------------------------+
|  [Gopal C.]: Hey! I've parked. Walking up.            |
|  [Priya S.]: Just arrived, standing near the rental.  |
|  [System]: Priya S. checked in successfully.          |
+-------------------------------------------------------+
|  [ Type message... ]                             [SMS]|
+-------------------------------------------------------+
```

---

### Screen 5: 👤 Profile Screen
Displays user identity, stats, and trust credentials.

```
+-------------------------------------------------------+
|  [Cover Photo: Sun rising over park]                  |
|                                                       |
|      ( Avatar Emoji / Image )                         |
|                                                       |
|   Rahul D.   [✔ Verified]                             |
|   📍 Vasant Vihar, New Delhi                          |
|                                                       |
|   "Runner, reader, occasional badminton player.       |
|   Always down for good coffee."                       |
|                                                       |
|   Configure Profile Picture:                          |
|   [ Illustration Avatar ]   [ Custom Photo (V2) ]     |
|   +-----------------------------------------------+   |
|   |  (🦊)  (🐼)  (🦁)  (🐯)  (🐨)  (🐸)  (🏃)  (🏸)     |   |
|   +-----------------------------------------------+   |
|                                                       |
|   +-----------------------------------------------+   |
|   |   6 Hosted    |   21 Joined   |   6 Badges    |   |
|   +-----------------------------------------------+   |
|                                                       |
|   ( Running ) ( Badminton ) ( Coffee ) ( Books )      |
|                                                       |
|   Badges                                              |
|   +---------------------+   +---------------------+   |
|   | [🛡️] Identity       |   | [🚀] Early          |   |
|   |     Verified        |   |     Adopter         |   |
|   +---------------------+   +---------------------+   |
|   | [🎯] Active         |   | [💪] Fitness        |   |
|   |     Organizer       |   |     Enthusiast      |   |
|   +---------------------+   +---------------------+   |
|                                                       |
|   [ Upcoming Plans ]      [[ Past Plans ]]            |
|   +-------------------------------------------------+ |
|   | IKEA Run — Need One More                        | |
|   | Sat, 11:00 AM • IKEA Gurugram                   | |
|   +-------------------------------------------------+ |
+-------------------------------------------------------+
```

* **Verifications**: Green outline verification tags are mapped.
* **History Tabs**: Past plans tab displays complete history.
