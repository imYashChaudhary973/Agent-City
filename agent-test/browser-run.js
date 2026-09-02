// Minimal Cloudflare Browser Run / WebMCP agent driver for Agent City.
// Run it in the page — browser console, a Browser Run session, or ChatGPT's
// in-app browser — once https://agent-city.imyash-chaudhary2.workers.dev has loaded.
//
// Calls go through `window.__agentCityToolMap`, the driver hook Agent City
// exposes in `app/src/lib/webmcp.ts`. Those are the same executors the browser
// gets, so every call is logged, drawn as a courier on the city map, and
// approval-gated: reserve_venue, place_catering_order, schedule_event, the
// modify_* tools and every cancel_* tool park at City Hall until a human
// clicks Approve in the app. Read tools run straight through.
//
// No dates are hardcoded here. The Worker's datasets roll with the calendar
// (`demoDates()` in `src/data.ts`, day 0 = today UTC), so "tomorrow" is always
// a bookable day.

async function toolMap() {
  // Poll until Agent City has registered its tools.
  for (let i = 0; i < 50; i++) {
    const map = window.__agentCityToolMap;
    if (map && Object.keys(map).length) return map;
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error('No WebMCP tools discovered');
}

async function discoverTools() {
  return Object.values(await toolMap());
}

async function runTool(name, input) {
  const map = await toolMap();
  const t = map[name];
  // Dynamic tools only exist once the matching commitment does.
  if (!t) throw new Error(`Tool ${name} not available`);
  return t.execute(input, { signal: new AbortController().signal });
}

export async function organizeMeetup(attendees = 12, budget = 10000) {
  // UTC arithmetic, matching the app store and the Worker's demoDates().
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + 1);
  const date = d.toISOString().split('T')[0];

  const tools = await discoverTools();
  console.log('Discovered tools:', tools.map((t) => t.name));

  const venues = await runTool('search_venues', {
    minimumCapacity: attendees,
    maximumPrice: budget,
    date,
  });
  console.log('Venues:', venues);

  const venue = venues.matches?.[0];
  if (!venue) throw new Error('No venue found');

  await runTool('reserve_venue', { venueId: venue.id, attendees, date });
  console.log('Reserved', venue.name);

  const catering = await runTool('search_catering', {
    people: attendees,
    dietaryPreference: 'vegetarian',
    maximumPricePerPerson: Math.floor(budget / attendees),
  });
  console.log('Catering:', catering);

  const pkg = catering.matches?.find((p) => p.diet === 'vegetarian') || catering.matches?.[0];
  if (pkg) {
    await runTool('place_catering_order', { packageId: pkg.id, people: attendees });
    console.log('Ordered', pkg.name);
  }

  // Bounds are inclusive, so the 14:00 slot survives `after: '14:00'`.
  const slots = await runTool('find_available_slots', { date, after: '14:00' });
  console.log('Slots:', slots);

  // /calendar/slots answers with `matches`, same as the search endpoints.
  const slot = slots.matches?.[0];
  if (slot) {
    await runTool('schedule_event', { slotId: slot.id });
    console.log('Scheduled', slot.id);
  }

  const status = await runTool('get_budget_status', {});
  console.log('Budget:', status);

  return { venue, pkg, slot, status };
}

export async function bumpAndReplan(attendees = 20, budget = 10000) {
  await runTool('update_event_requirements', { attendees });
  console.log('Updated attendees to', attendees);

  // The plan lives in get_event_plan; get_budget_status only returns money.
  const { event } = await runTool('get_event_plan', {});
  if (event?.venue && event.venue.capacity < attendees) {
    console.log('Capacity violation detected, replanning...');
    const venues = await runTool('search_venues', {
      minimumCapacity: attendees,
      maximumPrice: budget,
      date: event.date,
    });
    const venue = venues.matches?.find((v) => v.capacity >= attendees);
    if (!venue) throw new Error('No larger venue found');
    await runTool('cancel_reservation', {});
    await runTool('reserve_venue', { venueId: venue.id, attendees, date: event.date });
    console.log('Replanned to', venue.name);
  }
  return runTool('get_budget_status', {});
}

export { discoverTools, runTool };
