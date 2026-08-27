# Agent City

A miniature internet built for humans and AI agents.

## The Experiment

Most browser agents interact with websites by interpreting interfaces designed for humans.

Agent City explores another model: websites exposing structured capabilities directly through **WebMCP**. The same application is operated by humans through a visual UI and by agents through typed, discoverable tools — both reading and writing shared state.

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
   Agent City SPA  (React + Vite)
   ├── Venue district
   ├── Catering district
   ├── Calendar district
   └── Budget district
        │
        ▼
  Cloudflare Worker API
        │
        ▼
  In-memory deterministic datasets
```

- **Frontend**: React + TypeScript + Vite, Tailwind CSS
- **Backend**: Cloudflare Worker
- **State**: Shared React store + Worker request-scoped event plan header
- **Agent surface**: WebMCP imperative API (`document.modelContext.registerTool`)

## WebMCP Tool Surface

Read tools:

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

State-aware dynamic tools (registered only after the relevant selection):

- `modify_reservation`
- `cancel_reservation`
- `modify_catering_order`
- `cancel_catering_order`
- `reschedule_event`
- `cancel_event`

## Running Locally

```bash
npm install
npm run build:app
npm run dev
```

Open http://localhost:8787.

For WebMCP testing, use ChatGPT's in-app browser or Chrome's experimental WebMCP tooling.

## Deploy

```bash
npm run deploy
```

## Why WebMCP?

Traditional agents read the DOM, interpret UI, click, and hope. WebMCP lets a website declare what it can do: discoverable, typed, state-aware tools. Agent City demonstrates that duality with a shared human/agent UI and a live inspector.

## License

MIT
