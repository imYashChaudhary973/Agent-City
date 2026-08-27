# Agent City

A miniature internet built for humans and AI agents.

**Built for the OpenAI WebMCP Challenge (Aug 25 – Sep 3, 2026).**

Live demo: *https://agent-city.pages.dev* (deploy via `npm run deploy`)

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

## License

MIT
