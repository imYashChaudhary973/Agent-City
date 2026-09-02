# Agent City — 3-Minute Demo Video Script

Target length: **2:30 – 3:00 minutes**  
Upload to: **YouTube (public)**  
Required: **clear demo + audio narration**

---

## Recommended Recording Setup

- Screen recorder: macOS QuickTime / OBS / Loom / Screen Studio
- Browser: Chrome with WebMCP enabled, or ChatGPT in-app browser
- URL: https://agent-city.imyash-chaudhary2.workers.dev
- No copyrighted music. Use plain narration only.

---

## Shot List and Narration

### 0:00 – 0:20 | Opening + Hook

**Visual:** Agent City landing page.

**Audio:**
> "This is Agent City — a miniature internet built for humans and AI agents to operate together. Instead of an agent clicking through a UI made for people, Agent City exposes typed, discoverable WebMCP tools, so humans and agents share the same state."

**Action:** Click "Enter the City."

---

### 0:20 – 0:50 | What the Agent Sees

**Visual:** The city stage in the centre, the agent pane docked on the right.

**Audio:**
> "On the right is the agent pane — a live rendering of what `document.modelContext` exposes. It lists every tool the page currently offers: read tools like search venues, write tools like reserve venue that pause for my approval, and state-aware tools that only register once a reservation exists."

**Action:** Expand one read tool and one write tool to show the input schema and the READ / WRITE badges.

---

### 0:50 – 1:50 | Human Walkthrough

**Visual:** District panels opening over the city stage.

**Audio:**
> "A human can operate the city directly. I'll search venues, reserve Terminal 42, order a vegetarian package, book a calendar slot, and watch the budget update live. The demo data rolls with the calendar — it always covers today and the next two days — so the dates are never stale."

**Action:**
1. Click **Venues** → **Search for venues**.
2. Click **Reserve** on Terminal 42.
3. Click **Catering** → **Search catering**.
4. Click **Order** on Basic Veg Thali.
5. Click **Calendar** → **Find slots**.
6. Click **Schedule** on a slot.
7. Click **Plan** and point at the budget and constraints.

---

### 1:50 – 2:35 | Constraint Violation and Replan

**Visual:** The Plan district with the constraint violation banner.

**Audio:**
> "Now eight more developers are coming, so I bump attendees to 20. Terminal 42 only seats 12, so Agent City flags a constraint violation. Auto-replan searches again, takes the smallest venue that still fits, moves the reservation, and recalculates the budget — still under ₹10,000."

**Action:**
1. Click **20** under **QUICK ADJUSTMENTS**.
2. Wait for the **CONSTRAINT VIOLATION** banner.
3. Click **Auto-replan**.
4. Wait for the venue to change to Cache Corner (capacity 20).
5. Point at the updated budget and the now-valid constraints.

---

### 2:35 – 2:55 | Why WebMCP Matters

**Visual:** The full city stage — AGENT and YOU origins, CITY HALL in the middle, the four district buildings — with the agent pane beside it.

**Audio:**
> "Every action is a WebMCP tool call, and the city draws it: a courier leaves City Hall, carries the call to the district, and returns with the result. Gated calls park at City Hall until I approve them. That's the point — the web becomes a structured, observable, collaborative surface for both humans and agents."

**Action:** Click **City** for the full stage, tick **FOLLOW AGENT** (off by default) so the centre view tracks whatever district is live, and point at a courier finishing a trip while its tool card in the pane reports the duration.

---

### 2:55 – 3:00 | Closing

**Visual:** City Overview with all constraints valid.

**Audio:**
> "Agent City. A web built for humans and agents. Live at agent-city dot imyash-chaudhary2 dot workers dot dev."

---

## Optional Agent Voiceover Version

If you have access to ChatGPT's in-app browser, replace the human walkthrough with:

> "Now I'll hand it to the agent. 'Organize a vegetarian meetup for 12 people tomorrow afternoon under ₹10,000.' Watch the agent pane light up as the agent reasons through the tools."

Then show the approval modal appearing on the first reservation, approve it, and follow with the replan prompt.

---

## Submission Form Fields

- **Video title:** Agent City — WebMCP demo
- **Description:** 3-minute demo of Agent City, an experimental agent-native web environment for the OpenAI WebMCP Challenge.
- **Tags:** WebMCP, OpenAI, AI agents, human-agent collaboration, Agent City
