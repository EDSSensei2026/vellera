import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const BJJ_KEYWORDS = ['bjj', 'jiu jitsu', 'jiu-jitsu', 'grappling', 'submission', 'rolling', 'open mat'];
const MMA_KEYWORDS = ['mma', 'sparring', 'striking', 'boxing', 'muay thai', 'kickboxing', 'combat'];
const STRENGTH_KEYWORDS = ['lab', 'lift', 'strength', 'gym', 'workout', 'weights', 'conditioning'];

function classifyEvent(title = '', desc = '') {
  const text = (title + ' ' + desc).toLowerCase();
  if (BJJ_KEYWORDS.some(k => text.includes(k))) return { type: 'BJJ', session_type: 'BJJ Training Day' };
  if (MMA_KEYWORDS.some(k => text.includes(k))) return { type: 'MMA', session_type: 'BJJ Training Day' };
  if (STRENGTH_KEYWORDS.some(k => text.includes(k))) return { type: 'Strength', session_type: 'Strength Day' };
  return null;
}

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const base44 = createClientFromRequest(req);

    const state = body.data?._provider_meta?.['x-goog-resource-state'];
    if (state === 'sync') return Response.json({ status: 'sync_ack' });

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlecalendar');
    const authHeader = { Authorization: `Bearer ${accessToken}` };

    // Load sync token
    const syncStates = await base44.asServiceRole.entities.SyncState.filter({ key: 'gcal_main' });
    const syncRecord = syncStates[0] || null;

    let url = 'https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=100&singleEvents=true';
    if (syncRecord?.sync_token) {
      url += `&syncToken=${encodeURIComponent(syncRecord.sync_token)}`;
    } else {
      url += `&timeMin=${new Date(Date.now() - 7 * 86400000).toISOString()}`;
    }

    let res = await fetch(url, { headers: authHeader });

    if (res.status === 410) {
      url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=100&singleEvents=true&timeMin=${new Date(Date.now() - 7 * 86400000).toISOString()}`;
      res = await fetch(url, { headers: authHeader });
    }

    if (!res.ok) {
      console.error('Google Calendar webhook fetch error:', await res.text());
      return Response.json({ status: 'api_error' });
    }

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

    for (const event of allItems) {
      if (event.status === 'cancelled') continue;
      const classification = classifyEvent(event.summary, event.description || '');
      if (!classification) continue;

      const startStr = event.start?.dateTime || event.start?.date;
      if (!startStr) continue;

      const startDate = new Date(startStr);
      const endStr = event.end?.dateTime || event.end?.date;
      const dateOnly = startDate.toISOString().split('T')[0];
      const durationMin = endStr ? Math.round((new Date(endStr) - startDate) / 60000) : 60;

      // Upsert TrainingSession
      const existing = await base44.asServiceRole.entities.TrainingSession.filter({ google_event_id: event.id });
      if (existing.length === 0) {
        await base44.asServiceRole.entities.TrainingSession.create({
          date: dateOnly,
          session_type: classification.type === 'BJJ' ? 'BJJ/Grappling' : classification.type === 'MMA' ? 'Striking/MMA' : 'Strength & Conditioning',
          duration_minutes: durationMin,
          notes: `Auto-imported: ${event.summary}`,
          google_event_id: event.id,
          intensity: 'moderate',
        });
      }

      // Auto-create NutritionPlan if class is in the past
      if (startDate < now) {
        const existingPlan = await base44.asServiceRole.entities.NutritionPlan.filter({ date: dateOnly });
        if (existingPlan.length === 0) {
          await base44.asServiceRole.entities.NutritionPlan.create({
            date: dateOnly,
            day_type: classification.session_type,
            notes: `Auto-created from calendar: ${event.summary}`,
          });
        }
      }
    }

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

    return Response.json({ status: 'ok', processed: allItems.length });
  } catch (error) {
    console.error('calendarWebhookHandler error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});