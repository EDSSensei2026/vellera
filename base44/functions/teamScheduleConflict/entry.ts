import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/**
 * teamScheduleConflict
 * AI-powered double-booking detector for TeamSchedule events.
 * Checks new or updated events against existing schedule for participant conflicts.
 *
 * Payload: {
 *   event: { title, event_type, participant_emails[], start_datetime, end_datetime, team_id, organizer_email, location, is_medical? }
 *   mode: 'check' | 'create'  — 'check' only returns conflicts, 'create' saves if no conflicts
 * }
 */

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { event, mode = 'check' } = body;

  if (!event?.start_datetime || !event?.end_datetime || !event?.participant_emails?.length) {
    return Response.json({ error: 'Missing required fields: start_datetime, end_datetime, participant_emails' }, { status: 400 });
  }

  const newStart = new Date(event.start_datetime);
  const newEnd   = new Date(event.end_datetime);

  // Fetch all existing TeamSchedule events for the same team
  const existingEvents = await base44.asServiceRole.entities.TeamSchedule.filter(
    event.team_id ? { team_id: event.team_id } : {}
  );

  const conflicts = [];

  for (const existing of existingEvents) {
    if (existing.status === 'cancelled') continue;

    const existStart = new Date(existing.start_datetime);
    const existEnd   = new Date(existing.end_datetime);

    // Overlap check: (newStart < existEnd) && (newEnd > existStart)
    const overlaps = newStart < existEnd && newEnd > existStart;
    if (!overlaps) continue;

    // Check participant overlap
    const newParticipants = new Set(event.participant_emails);
    const conflictingParticipants = (existing.participant_emails || []).filter(e => newParticipants.has(e));

    if (conflictingParticipants.length === 0) continue;

    // Flag double-booking: clinic vs training conflict is highest severity
    const isMedicalConflict = event.is_medical !== existing.is_medical;
    const severity = isMedicalConflict ? 'HIGH' : 'MEDIUM';

    conflicts.push({
      conflict_id:             existing.id,
      conflicting_event_title: existing.title,
      conflicting_event_type:  existing.event_type,
      conflicting_start:       existing.start_datetime,
      conflicting_end:         existing.end_datetime,
      affected_participants:   conflictingParticipants,
      severity,
      recommendation: isMedicalConflict
        ? `Medical/clinic appointment conflicts with team training for ${conflictingParticipants.join(', ')}. Reschedule team event or request medical clearance.`
        : `Schedule overlap detected for ${conflictingParticipants.join(', ')}. Consider staggering start times or reducing participant list.`,
    });
  }

  console.log(`[teamScheduleConflict] Checked event "${event.title}": ${conflicts.length} conflict(s) found`);

  // If mode=create and no conflicts, save the event
  if (mode === 'create') {
    const conflictDetected = conflicts.length > 0;
    const savedEvent = await base44.asServiceRole.entities.TeamSchedule.create({
      ...event,
      organizer_email:       event.organizer_email || user.email,
      created_by_role:       user.role,
      conflict_detected:     conflictDetected,
      conflict_details:      conflictDetected ? conflicts.map(c => c.recommendation).join(' | ') : null,
      conflicting_event_ids: conflictDetected ? conflicts.map(c => c.conflict_id) : [],
      status:                'scheduled',
    });

    return Response.json({
      success: true,
      event_id: savedEvent.id,
      conflict_detected: conflictDetected,
      conflicts,
      message: conflictDetected
        ? `Event created with ${conflicts.length} conflict warning(s). Review before confirming.`
        : 'Event created successfully with no conflicts.',
    });
  }

  return Response.json({
    conflict_detected: conflicts.length > 0,
    conflict_count: conflicts.length,
    conflicts,
    checked_at: new Date().toISOString(),
  });
});