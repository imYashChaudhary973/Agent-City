# Agent City

A miniature internet built for humans and AI agents.

**Built for the OpenAI WebMCP Challenge (Aug 25 – Sep 3, 2026).**

Live demo: **https://agent-city.imyash-chaudhary2.workers.dev**

Public repository: **https://github.com/imYashChaudhary973/Agent-City**

License: **MIT**

## The Experiment

Most browser agents interact with websites by interpreting interfaces designed for humans. Agent City explores another model: websites exposing structured capabilities directly through **WebMCP** (`document.modelContext`). The same application is operated by humans through a visual UI and by agents through typed, discoverable tools — both reading and writing shared state.

## Demo Scenario

Open Agent City in a WebMCP-capable browser and ask:

> Organize a vegetarian developer meetup for 12 people tomorrow afternoon. Keep the total under ₹10,000.

Watch the agent discover tools, search venues, find catering, check the calendar, calculate the budget, and request approval before mutating state.

Then try:

> Actually, 8 more developers are coming. Make it 20 people, but don't exceed ₹10,000.

The venue will no longer fit. The agent sees the constraint violation, searches alternatives, and replans.

## Architecture

```
ChatGPT / Browser Agent
        │
        │ WebMCP
        ▼
  document.modelContext
        │
        ▼
   Agent City SPA  (React + Vite + TypeScript)
   ├── Venue district
   ├── Catering district
   ├── Calendar district
   └── Budget district
        │
        ▼
  Cloudflare Worker API
        │
        ▼
  Deterministic in-memory datasets
```

- **Frontend**: React 19 + TypeScript + Vite, Tailwind CSS
- **Backend**: Cloudflare Worker (Hono-style routing in vanilla Workers)
- **State**: Shared React store + Worker request-scoped event plan header
- **Agent surface**: WebMCP imperative API with typed JSON schemas, read-only annotations, dynamic registration, and human-in-the-loop approval

## WebMCP Tool Surface

Read tools (annotated `readOnlyHint: true`):

- `search_venues`
- `get_venue_details`
- `search_catering`
- `calculate_catering`
- `find_available_slots`
- `get_event_plan`
- `get_budget_status`
- `calculate_event_cost`

Write tools (require human approval):

- `reserve_venue`
- `place_catering_order`
- `schedule_event`
- `update_event_requirements`

Dynamic state-aware tools (registered only after the relevant selection):

- `modify_reservation` / `cancel_reservation` (after venue reserved)
- `modify_catering_order` / `cancel_catering_order` (after catering ordered)
- `reschedule_event` / `cancel_event` (after event scheduled)

The inspector shows the currently available tool set, mode (READ/WRITE/DESTRUCTIVE), and every WebMCP call with input/output and timing.

## Running Locally

```bash
npm install
npm run build:app
npm run dev
```

Open http://localhost:8787.

For WebMCP testing, use ChatGPT's in-app browser, Chrome DevTools MCP, or Cloudflare Browser Run lab sessions (`lab=true`).

## Deploy

```bash
npm run deploy
```

This builds the Vite app and deploys the Worker + static assets to Cloudflare Workers.

## Submission Checklist

- [x] Working hosted application
- [x] Public code repository (https://github.com/imYashChaudhary973/Agent-City)
- [x] Open-source license (MIT)
- [x] Written project description (this README)
- [ ] 3-minute demo video with audio

## Why WebMCP?

Traditional agents read the DOM, interpret UI, click, and hope. WebMCP lets a website declare what it can do: discoverable, typed, state-aware tools. Agent City demonstrates that duality with a shared human/agent UI, a live WebMCP inspector, and visible agent reasoning.

## What People and Agents Can Do Together

Before WebMCP, an agent could only operate a website by guessing how its buttons and forms worked. A human and an agent could not share live state or collaborate on the same task inside one application.

Agent City makes that possible:

- **Humans** use the visual city interface to search venues, order catering, pick calendar slots, and adjust the budget.
- **Agents** use the exact same WebMCP tools to perform the same actions, with their calls logged in the inspector.
- **Both** see the same event plan update live. When the agent reserves a venue, the human UI immediately shows "Reserved." When the human changes the attendee count, the agent sees new tool availability and can replan.
- **Sensitive actions** pause for human approval before executing, so the agent never mutates state without consent.

## How WebMCP Is Implemented

Agent City uses the imperative WebMCP API:

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
  execute: async (input) => { /* query app state and return results */ }
});
```

Key implementation choices:

- **One tool per capability** — no overlapping tools, keeping the agent's context small and selection fast.
- **Read-only annotations** — search/get tools are marked `readOnlyHint: true` so the agent knows they are safe.
- **Dynamic tool surface** — tools like `modify_reservation`, `cancel_reservation`, `reschedule_event`, and `cancel_event` are registered only when they become relevant, demonstrating state-aware agent capabilities.
- **Human-in-the-loop** — write tools (`reserve_venue`, `place_catering_order`, `schedule_event`) can pause for approval through a shared pending-approval store.
- **Shared state** — the React store and the Worker API both operate on the same event plan, so human clicks and agent tool calls produce identical state changes.
- **Inspector + activity graph** — every tool call is logged with input, output, duration, and status, and visualized as a live city activity graph.

## License

MIT
