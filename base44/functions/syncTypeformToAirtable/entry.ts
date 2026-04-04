import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const ONBOARDING_TABLE_NAME = 'Member Onboarding';

async function getOrCreateTable(accessToken, baseId) {
  // Fetch tables in the base
  const res = await fetch(`https://api.airtable.com/v0/meta/bases/${baseId}/tables`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await res.json();
  
  if (data.error) {
    throw new Error(`Airtable error: ${data.error.type} - ${data.error.message}`);
  }

  const table = data.tables.find(t => t.name === ONBOARDING_TABLE_NAME);
  if (table) {
    return table;
  }

  throw new Error(`Table "${ONBOARDING_TABLE_NAME}" not found. Create it in Airtable with fields: Name, Email, Age, Fitness Level, Disciplines, Goals, Availability, Injuries, Referral Source, Coach Notes.`);
}

async function syncResponsesToAirtable(accessToken, baseId, tableId, responses) {
  const recordsToCreate = [];

  // Parse responses into Airtable record format
  responses.forEach(item => {
    const answers = {};
    (item.answers || []).forEach(a => {
      const label = a.field?.ref || a.field?.id || '';
      answers[label] = a.text || a.email || a.number || a.choice?.label || a.choices?.labels?.join(', ') || '';
    });

    // Extract key fields (customize field mapping based on your Airtable schema)
    const name = answers.name || 'Unknown';
    const email = Object.values(answers).find(v => v && v.includes('@')) || '';
    const age = answers.age || '';
    const fitnessLevel = answers.fitness_level || '';
    const disciplines = answers.disciplines || '';
    const goals = answers.goals || '';
    const availability = answers.availability || '';
    const injuries = answers.injuries || '';
    const referralSource = answers.referral_source || '';
    const coachNotes = answers.coach_notes || '';

    recordsToCreate.push({
      fields: {
        'Name': name,
        'Email': email,
        'Age': age ? parseInt(age) : undefined,
        'Fitness Level': fitnessLevel,
        'Disciplines': disciplines,
        'Goals': goals,
        'Availability': availability,
        'Injuries': injuries,
        'Referral Source': referralSource,
        'Coach Notes': coachNotes,
        'Typeform Response ID': item.response_id,
        'Submitted At': item.submitted_at,
      },
    });
  });

  // Filter out undefined fields
  recordsToCreate.forEach(r => {
    Object.keys(r.fields).forEach(k => {
      if (r.fields[k] === undefined) delete r.fields[k];
    });
  });

  if (recordsToCreate.length === 0) {
    return { created: 0, skipped: 0 };
  }

  // Batch create records (Airtable allows 10 per request)
  const batchSize = 10;
  let created = 0;

  for (let i = 0; i < recordsToCreate.length; i += batchSize) {
    const batch = recordsToCreate.slice(i, i + batchSize);

    const createRes = await fetch(
      `https://api.airtable.com/v0/${baseId}/${tableId}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ records: batch }),
      }
    );

    const result = await createRes.json();
    if (result.error) {
      console.error(`Batch create error: ${result.error.type} - ${result.error.message}`);
      throw new Error(`Failed to sync records: ${result.error.message}`);
    }

    created += result.records?.length || 0;
  }

  return { created, skipped: responses.length - created };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { baseId, tableId } = body;

    if (!baseId) {
      return Response.json({ error: 'baseId required. You can find it in your Airtable URL: https://airtable.com/appXXXXXXXXXX/...' }, { status: 400 });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('airtable');

    // If tableId not provided, fetch it from base metadata
    let table = tableId ? { id: tableId, name: ONBOARDING_TABLE_NAME } : await getOrCreateTable(accessToken, baseId);

    // Fetch Typeform responses
    const typeformRes = await base44.functions.invoke('typeformOnboarding', { action: 'responses' });
    const responses = typeformRes.data?.responses || [];

    console.log(`Syncing ${responses.length} Typeform responses to Airtable base ${baseId}, table ${table.id}`);

    const result = await syncResponsesToAirtable(accessToken, baseId, table.id, responses);

    return Response.json({
      message: `Synced ${result.created} records to Airtable`,
      created: result.created,
      baseId,
      tableId: table.id,
      tableName: table.name,
    });
  } catch (error) {
    console.error('syncTypeformToAirtable error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});