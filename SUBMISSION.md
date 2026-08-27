# Agent City — OpenAI WebMCP Challenge Submission

**Live URL:** https://agent-city.imyash-chaudhary2.workers.dev  
**Repository:** https://github.com/imYashChaudhary973/Agent-City  
**License:** MIT (`LICENSE` file included)  
**Challenge:** OpenAI WebMCP Challenge (Aug 25 – Sep 3, 2026)

---

## 1. Why Agent City Is a Strong Fit for WebMCP

Agent City is not a traditional web app with an API bolted on. It is an **experimental agent-native web environment**: the same application surface is exposed to humans as a visual UI and to agents as typed, discoverable WebMCP tools. The event-planning scenario exists only to make the agent-native design concrete.

WebMCP is the right fit because:

- **Tool discovery replaces DOM guessing.** The agent does not need to interpret buttons, forms, or cards. It reads `document.modelContext` and gets schemas.
- **State-aware capabilities.** Tools appear and disappear as the event plan evolves, matching Chrome's guidance to register only relevant tools.
- **Shared state between human and agent.** Every tool execution mutates the same React store that the human UI reads, so both operators see identical live results.
- **Observable reasoning.** The WebMCP inspector and city activity graph make agent behavior visible to the user, which is hard to achieve with screenshot-based agents.

---

## 2. Better User Experience

Before WebMCP, a human and an agent could not truly collaborate inside the same web application. The agent either worked in a black box or required fragile DOM automation.

Agent City creates a better experience by:

- **Transparency:** every agent action is logged with tool name, input, output, duration, and status.
- **Control:** write tools can pause for human approval before mutating state.
- **Shared context:** when the agent reserves a venue, the human sees it instantly; when the human adjusts attendees, the agent sees the constraint violation and can replan.
- **No mode switching:** the human does not leave the app to verify what the agent did. The inspector is part of the same interface.

---

## 3. What People and Agents Can Do Together That Was Difficult Before

- **Joint event planning:** a user can ask an agent to "organize a vegetarian meetup for 12 people under ₹10,000" and watch it reason through venues, catering, calendar, and budget — while staying in the same tab and sharing state.
- **Conflict resolution:** when requirements change (e.g., 12 → 20 people), the agent detects the capacity violation, proposes a larger venue, recalculates catering and budget, and gets approval before making changes.
- **Human veto power:** before any reservation, order, or schedule mutation, the user can approve or reject the agent's proposed action.
- **Cross-surface consistency:** the human UI and the agent tools cannot drift out of sync because they both call the same executors.

---

## 4. How WebMCP Is Implemented

Agent City registers tools with the imperative WebMCP API:

```ts
await document.modelContext.registerTool({
  name: 'search_venues',
  description: 'Search Agent City venues by capacity, price, and date.',
  inputSchema: {
    type: 'object',
    properties: {
      minimumCapacity: { type: 'integer' },
      maximumPrice: { type: 'number' },
      date: { type: 'string' }
    },
    required: ['minimumCapacity']
  },
  annotations: { readOnlyHint: true },
  execute: async (input) => { /* query state */ }
});
```

Implementation details:

- **Tool design:** one clear capability per tool; read tools annotated; write tools require approval.
- **Dynamic registration:** `modify_reservation`, `cancel_reservation`, `reschedule_event`, and `cancel_event` are registered only when relevant.
- **Shared executors:** human UI buttons and WebMCP agent calls route through the same `runTool()` path, so the inspector logs both.
- **State management:** a shared React store holds the event plan; the Worker API computes budget and availability from an `x-agent-city-plan` header.
- **Approval flow:** write tools add a pending approval entry; the UI shows an approval modal; execution continues only after user approval.

Key files:

- `app/src/lib/tools.ts` — tool definitions, schemas, and executors
- `app/src/lib/webmcp.ts` — WebMCP registration, dynamic tool surface, window hooks
- `app/src/hooks/useWebMCP.ts` — registers tools when state changes
- `app/src/components/Inspector.tsx` — live tool inspector
- `app/src/districts/OverviewDistrict.tsx` — auto-replan UI
- `src/index.ts` — Cloudflare Worker API

---

## 5. Project Timeline and Prior vs New Work

Agent City was created inside the hackathon submission window. All WebMCP-specific work was added between **2026-08-27 12:51 IST and 2026-08-27 14:16 IST** as shown by the commit history below. There is no pre-existing production version or prior public release.

| Commit | Timestamp (IST) | What was added |
|---|---|---|
| `3c98046` | 2026-08-27 12:51:30 | Initial Agent City experiment — WebMCP-native event planning scaffold |
| `a56284c` | 2026-08-27 12:55:58 | Aligned WebMCP implementation with current `document.modelContext` spec |
| `69d1c93` | 2026-08-27 12:59:59 | Fixed toolchange event storm by tracking the registered tool surface |
| `9e7dea7` | 2026-08-27 13:25:36 | Improved city graph readability and district selection UX |
| `559c21b` | 2026-08-27 13:38:11 | End-to-end demo scenario with constraint violation and replan flow |
| `96b9b62` | 2026-08-27 14:16:13 | Routed human UI through WebMCP tools; added agent replan driver and prompts |

The entire repository was built during the submission period. No prior work is claimed.

---

## 6. Third-Party Integrations

- **Google Fonts (Inter + JetBrains Mono)** — used under the standard Google Fonts terms of service; no API keys or data sharing.
- **Cloudflare Workers** — used for hosting and the Worker API.
- No other third-party SDKs, APIs, or proprietary datasets are used.

---

## 7. How to Test

Open the live URL in **ChatGPT's in-app browser** or **Google Chrome with WebMCP enabled**, then paste:

> Organize a vegetarian developer meetup for 12 people tomorrow afternoon. Keep the total simulated budget below ₹10,000 and don't schedule anything before 2 PM.

After the agent completes it, try:

> Actually, 8 more developers are coming, so make it 20 people total. Stay under ₹10,000.

You can also use the agent driver in `agent-test/browser-run.js` inside a Cloudflare Browser Run session or browser console.

---

## 8. Submission Checklist

- [x] Project built with required developer tools
- [x] Working live URL accessible via ChatGPT browser / Chrome WebMCP
- [x] Text description explaining WebMCP fit, UX, collaboration, and implementation
- [x] Public code repository with all source code and assets
- [x] Open-source license file (MIT)
- [ ] 3-minute demo video with audio (to be recorded and uploaded to YouTube)

---

## 9. Demo Video Script

A shot list and script are provided in `agent-test/video-script.md` to make recording the 3-minute submission video straightforward.
