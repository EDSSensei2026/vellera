import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/**
 * autoSchedule — AI conflict detection + scheduling assistant
 *
 * Payload:
 *   { mode: 'check_conflict', event: { practitioner_email, patient_email, start_datetime, end_datetime, title, event_type } }
 *   { mode: 'suggest_slots',  practitioner_email, patient_email, preferred_date, duration_minutes }
 *   { mode: 'confirm',        schedule_id }
 */
Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { mode } = body;

  // ── 1. Conflict Check ─────────────────────────────────────────────────────
  if (mode === 'check_conflict') {
    const { event } = body;
    if (!event?.start_datetime || !event?.end_datetime) {
      return Response.json({ error: 'start_datetime and end_datetime required' }, { status: 400 });
    }

    const start = new Date(event.start_datetime);
    const end   = new Date(event.end_datetime);

    // Fetch existing schedules for practitioner or patient on the same day
    const dayStart = new Date(start); dayStart.setHours(0, 0, 0, 0);
    const dayEnd   = new Date(start); dayEnd.setHours(23, 59, 59, 999);

    const [practitionerEvents, patientEvents] = await Promise.all([
      event.practitioner_email
        ? base44.asServiceRole.entities.Schedule.filter({ practitioner_email: event.practitioner_email })
        : Promise.resolve([]),
      event.patient_email
        ? base44.asServiceRole.entities.Schedule.filter({ patient_email: event.patient_email })
        : Promise.resolve([]),
    ]);

    const allEvents = [...practitionerEvents, ...patientEvents].filter(e =>
      e.status !== 'cancelled' && e.id !== event.id
    );

    const conflicts = allEvents.filter(e => {
      const eStart = new Date(e.start_datetime);
      const eEnd   = new Date(e.end_datetime);
      return start < eEnd && end > eStart;
    });

    if (conflicts.length === 0) {
      return Response.json({ conflict: false, message: 'No conflicts detected. Slot is available.' });
    }

    // Generate alternative slots (same day, gaps found)
    const duration = (end - start) / 60000;
    const altSlots = generateAltSlots(allEvents, start, duration, 3);

    return Response.json({
      conflict: true,
      conflicts: conflicts.map(c => ({
        id: c.id,
        title: c.title,
        start: c.start_datetime,
        end: c.end_datetime,
      })),
      alt_slots: altSlots,
      message: `${conflicts.length} conflict(s) detected. ${altSlots.length} alternative slot(s) suggested.`,
    });
  }

  // ── 2. Suggest Slots ──────────────────────────────────────────────────────
  if (mode === 'suggest_slots') {
    const { practitioner_email, patient_email, preferred_date, duration_minutes = 60 } = body;
    if (!practitioner_email || !preferred_date) {
      return Response.json({ error: 'practitioner_email and preferred_date required' }, { status: 400 });
    }

    const existing = await base44.asServiceRole.entities.Schedule.filter({
      practitioner_email,
    });

    const baseDate = new Date(preferred_date);
    const slots = generateAltSlots(existing, baseDate, duration_minutes, 5);

    return Response.json({ suggested_slots: slots, duration_minutes });
  }

  // ── 3. Confirm (mark ai_suggested=true, status=confirmed) ────────────────
  if (mode === 'confirm') {
    const { schedule_id } = body;
    if (!schedule_id) return Response.json({ error: 'schedule_id required' }, { status: 400 });

    await base44.asServiceRole.entities.Schedule.update(schedule_id, {
      status: 'confirmed',
    });
    return Response.json({ success: true, message: 'Schedule confirmed.' });
  }

  return Response.json({ error: `Unknown mode: ${mode}` }, { status: 400 });
});

// ── Helper: find N free slots on the same day ────────────────────────────────
function generateAltSlots(existingEvents, baseDate, durationMinutes, count) {
  const slots = [];
  const day = new Date(baseDate);
  day.setHours(8, 0, 0, 0); // Start from 8am

  const busyBlocks = existingEvents
    .filter(e => e.status !== 'cancelled' && e.start_datetime)
    .map(e => ({
      start: new Date(e.start_datetime).getTime(),
      end:   new Date(e.end_datetime || e.start_datetime).getTime() + 30 * 60000,
    }))
    .sort((a, b) => a.start - b.start);

  let cursor = day.getTime();
  const dayEnd = new Date(day); dayEnd.setHours(19, 0, 0, 0);

  while (slots.length < count && cursor < dayEnd.getTime()) {
    const slotEnd = cursor + durationMinutes * 60000;
    const hasConflict = busyBlocks.some(b => cursor < b.end && slotEnd > b.start);

    if (!hasConflict) {
      slots.push(new Date(cursor).toISOString());
    }
    cursor += 30 * 60000; // increment 30 min
  }

  return slots;
}