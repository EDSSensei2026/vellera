import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

// Keywords to classify calendar events as BJJ/MMA/Strength training
const BJJ_KEYWORDS = ['bjj', 'jiu jitsu', 'jiu-jitsu', 'grappling', 'submission', 'rolling', 'open mat'];
const MMA_KEYWORDS = ['mma', 'sparring', 'striking', 'boxing', 'muay thai', 'kickboxing', 'combat'];
const STRENGTH_KEYWORDS = ['lab', 'lift', 'strength', 'gym', 'workout', 'weights', 'conditioning', 'crossfit'];

function classifyEvent(title = '', desc = '') {
  const text = (title + ' ' + desc).toLowerCase();
  if (BJJ_KEYWORDS.some(k => text.includes(k))) return { type: 'BJJ', session_type: 'BJJ Training Day' };
  if (MMA_KEYWORDS.some(k => text.includes(k))) return { type: 'MMA', session_type: 'BJJ Training Day' };
  if (STRENGTH_KEYWORDS.some(k => text.includes(k))) return { type: 'Strength', session_type: 'Strength Day' };
  return null;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlecalendar');
    const authHeader = { Authorization: `Bearer ${accessToken}` };

    // Get sync state
    const syncStates = await base44.asServiceRole.entities.SyncState.filter({ key: 'gcal_main' });
    const syncRecord = syncStates[0] || null;

    let url = 'https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=100&singleEvents=true&orderBy=startTime';
    if (syncRecord?.sync_token) {
      url += `&syncToken=${encodeURIComponent(syncRecord.sync_token)}`;
    } else {
      // First sync: look 30 days back, 60 days forward
      const timeMin = new Date(Date.now() - 30 * 86400000).toISOString();
      const timeMax = new Date(Date.now() + 60 * 86400000).toISOString();
      url += `&timeMin=${timeMin}&timeMax=${timeMax}`;
    }

    let res = await fetch(url, { headers: authHeader });

    // syncToken expired — full re-sync
    if (res.status === 410) {
      const timeMin = new Date(Date.now() - 30 * 86400000).toISOString();
      const timeMax = new Date(Date.now() + 60 * 86400000).toISOString();
      url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=100&singleEvents=true&orderBy=startTime&timeMin=${timeMin}&timeMax=${timeMax}`;
      res = await fetch(url, { headers: authHeader });
    }

    if (!res.ok) {
      const err = await res.text();
      console.error('Google Calendar API error:', err);
      return Response.json({ error: 'Calendar API error', details: err }, { status: 500 });
    }

    // Drain all pages
    const allItems = [];
    let pageData = await res.json();
    let newSyncToken = null;
    while (true) {
      allItems.push(...(pageData.items || []));
      if (pageData.nextSyncToken) newSyncToken = pageData.nextSyncToken;
      if (!pageData.nextPageToken) break;
      const nextRes = await fetch(url + `&pageToken=${pageData.nextPageToken}`, { headers: authHeader });
      if (!nextRes.ok) break;
      pageData = await nextRes.json();
    }

    const now = new Date();
    let imported = 0;
    let autoLogged = 0;

    for (const event of allItems) {
      if (event.status === 'cancelled') continue;

      const classification = classifyEvent(event.summary, event.description || '');
      if (!classification) continue;

      const startStr = event.start?.dateTime || event.start?.date;
      const endStr = event.end?.dateTime || event.end?.date;
      if (!startStr) continue;

      const startDate = new Date(startStr);
      const dateOnly = startDate.toISOString().split('T')[0];

      // Check if already imported (by google_event_id in TrainingSession)
      const existing = await base44.entities.TrainingSession.filter({ google_event_id: event.id });
      if (existing.length > 0) continue;

      const durationMin = endStr
        ? Math.round((new Date(endStr) - startDate) / 60000)
        : 60;

      const sessionData = {
        date: dateOnly,
        session_type: classification.type === 'BJJ' ? 'BJJ/Grappling' : classification.type === 'MMA' ? 'Striking/MMA' : 'Strength & Conditioning',
        duration_minutes: durationMin,
        notes: `Imported from Google Calendar: ${event.summary}`,
        google_event_id: event.id,
        intensity: 'moderate',
      };

      await base44.entities.TrainingSession.create(sessionData);
      imported++;

      // Auto-log session if the class time has already passed
      if (startDate < now) {
        // Check if NutritionPlan already exists for that date
        const existingPlan = await base44.entities.NutritionPlan.filter({ date: dateOnly });
        if (existingPlan.length === 0) {
          await base44.entities.NutritionPlan.create({
            date: dateOnly,
            day_type: classification.session_type,
            notes: `Auto-created from calendar: ${event.summary}`,
          });
          autoLogged++;
        }
      }
    }

    // Save new sync token
    if (newSyncToken) {
      if (syncRecord) {
        await base44.asServiceRole.entities.SyncState.update(syncRecord.id, {
          sync_token: newSyncToken,
          last_synced: new Date().toISOString(),
        });
      } else {
        await base44.asServiceRole.entities.SyncState.create({
          key: 'gcal_main',
          sync_token: newSyncToken,
          last_synced: new Date().toISOString(),
        });
      }
    }

    return Response.json({
      success: true,
      events_processed: allItems.length,
      sessions_imported: imported,
      nutrition_plans_auto_created: autoLogged,
    });
  } catch (error) {
    console.error('calendarSync error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});