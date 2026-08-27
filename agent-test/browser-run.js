// Minimal Cloudflare Browser Run / WebMCP agent driver for Agent City.
// This script assumes it runs in an environment where `document.modelContext`
// is available and the page has loaded https://agent-city.imyash-chaudhary2.workers.dev

async function discoverTools() {
  // Poll until Agent City has registered its tools.
  for (let i = 0; i < 50; i++) {
    if (window.__agentCityTools?.length) return window.__agentCityTools;
    if (document.modelContext?.getRegisteredTools) {
      const tools = await document.modelContext.getRegisteredTools();
      if (tools.length) return tools;
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error('No WebMCP tools discovered');
}

async function runTool(name, input) {
  // Direct WebMCP call path: use the browser's registered tool execution.
  if (document.modelContext?.callTool) {
    return document.modelContext.callTool(name, input);
  }
  // Fallback: find the tool registration and call execute directly.
  const tools = await discoverTools();
  const t = tools.find((x) => x.name === name);
  if (!t) throw new Error(`Tool ${name} not found`);
  if (t.execute) return t.execute(input, { signal: new AbortController().signal });
  throw new Error(`Tool ${name} has no execute function`);
}

export async function organizeMeetup(attendees = 12, budget = 10000) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const date = tomorrow.toISOString().split('T')[0];

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

  const slots = await runTool('find_available_slots', { date, after: '14:00' });
  console.log('Slots:', slots);

  const slot = slots.slots?.[0];
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

  const status = await runTool('get_budget_status', {});
  if (status.event?.venue?.capacity < attendees) {
    console.log('Capacity violation detected, replanning...');
    const venues = await runTool('search_venues', {
      minimumCapacity: attendees,
      maximumPrice: budget,
      date: status.event.date,
    });
    const venue = venues.matches?.find((v) => v.capacity >= attendees);
    if (!venue) throw new Error('No larger venue found');
    await runTool('cancel_reservation', {});
    await runTool('reserve_venue', { venueId: venue.id, attendees, date: status.event.date });
    console.log('Replaned to', venue.name);
  }
  return runTool('get_budget_status', {});
}

export { discoverTools, runTool };
