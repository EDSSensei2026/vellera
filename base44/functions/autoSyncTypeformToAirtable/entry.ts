import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

async function findFormByTitle(accessToken, title) {
  const res = await fetch('https://api.typeform.com/forms?page_size=50', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await res.json();
  return (data.items || []).find(f => f.title === title);
}

async function getTypeformResponses(accessToken, formId, limit = 100) {
  const res = await fetch(`https://api.typeform.com/forms/${formId}/responses?page_size=${limit}&sort=submitted_at%2Cdesc`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await res.json();
  return data.items || [];
}

async function getAirtableRecordByResponseId(accessToken, baseId, tableId, responseId) {
  const res = await fetch(
    `https://api.airtable.com/v0/${baseId}/${tableId}?filterByFormula={Typeform Response ID}="${responseId}"`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  const data = await res.json();
  return (data.records || []).length > 0;
}

function parseTypeformResponse(item) {
  const answers = {};
  (item.answers || []).forEach(a => {
    const label = a.field?.ref || a.field?.id || '';
    answers[label] = a.text || a.email || a.number || a.choice?.label || a.choices?.labels?.join(', ') || '';
  });
  return answers;
}

async function createAirtableRecord(accessToken, baseId, tableId, fields) {
  const res = await fetch(
    `https://api.airtable.com/v0/${baseId}/${tableId}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        records: [{ fields }],
      }),
    }
  );
  const data = await res.json();
  if (data.error) {
    throw new Error(`Airtable error: ${data.error.message}`);
  }
  return data.records?.[0];
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { baseId, tableId, formTitle = 'Vellera Member Onboarding Survey' } = body;

    if (!baseId || !tableId) {
      return Response.json(
        { error: 'baseId and tableId required' },
        { status: 400 }
      );
    }

    // Get connectors
    const [typeformToken, airtableToken] = await Promise.all([
      base44.asServiceRole.connectors.getConnection('typeform'),
      base44.asServiceRole.connectors.getConnection('airtable'),
    ]);

    const typeformAccessToken = typeformToken.accessToken;
    const airtableAccessToken = airtableToken.accessToken;

    // Find the Typeform form
    const form = await findFormByTitle(typeformAccessToken, formTitle);
    if (!form) {
      return Response.json({ error: `Form "${formTitle}" not found in Typeform` }, { status: 404 });
    }

    // Get latest responses
    const responses = await getTypeformResponses(typeformAccessToken, form.id, 50);

    console.log(`Found ${responses.length} Typeform responses. Checking for new records to sync...`);

    let synced = 0;
    let skipped = 0;

    for (const item of responses) {
      // Check if already in Airtable
      const exists = await getAirtableRecordByResponseId(airtableAccessToken, baseId, tableId, item.response_id);
      if (exists) {
        skipped++;
        continue;
      }

      const answers = parseTypeformResponse(item);
      const email = Object.values(answers).find(v => v && v.includes('@')) || '';

      const fields = {
        'Name': answers.name || 'Unknown',
        'Email': email,
        'Age': answers.age ? parseInt(answers.age) : undefined,
        'Fitness Level': answers.fitness_level || '',
        'Disciplines': answers.disciplines || '',
        'Goals': answers.goals || '',
        'Availability': answers.availability || '',
        'Injuries': answers.injuries || '',
        'Referral Source': answers.referral_source || '',
        'Coach Notes': answers.coach_notes || '',
        'Typeform Response ID': item.response_id,
        'Submitted At': item.submitted_at,
      };

      // Remove undefined fields
      Object.keys(fields).forEach(k => {
        if (fields[k] === undefined) delete fields[k];
      });

      try {
        await createAirtableRecord(airtableAccessToken, baseId, tableId, fields);
        synced++;
        console.log(`Synced response ${item.response_id} to Airtable`);
      } catch (err) {
        console.error(`Failed to sync ${item.response_id}:`, err.message);
      }
    }

    return Response.json({
      message: `Sync complete: ${synced} new records synced, ${skipped} already in Airtable`,
      synced,
      skipped,
      formId: form.id,
      baseId,
      tableId,
    });
  } catch (error) {
    console.error('autoSyncTypeformToAirtable error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});