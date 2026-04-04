import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

function buildMimeEmail(from, to, subject, htmlBody) {
  const mimeEmail = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset="UTF-8"',
    'Content-Transfer-Encoding: quoted-printable',
    '',
    htmlBody,
  ].join('\n');

  return Buffer.from(mimeEmail).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function sendGmailMessage(accessToken, raw) {
  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(`Gmail error: ${err.error?.message || res.statusText}`);
  }

  return res.json();
}

async function generateTrainingPlan(base44, userProfile, typeformData) {
  const prompt = `
You are an elite fitness coach. Create a personalized 4-week training plan for a new recruit based on their onboarding profile.

Recruit Profile:
- Name: ${typeformData.name || 'Unknown'}
- Age: ${typeformData.age || 'Not specified'}
- Fitness Level: ${typeformData.fitness_level || 'Beginner'}
- Primary Disciplines: ${typeformData.disciplines || 'General Fitness'}
- Goals: ${typeformData.goals || 'Improve overall fitness'}
- Availability: ${typeformData.availability || '3-4 days/week'}
- Known Injuries: ${typeformData.injuries || 'None'}

Format the response as an HTML email with:
1. Personalized greeting
2. Week-by-week breakdown (4 weeks)
3. Key focus areas for each week
4. 3-5 actionable tips
5. Recovery and nutrition guidelines

Keep it motivational, practical, and achievable.
`;

  const response = await base44.integrations.Core.InvokeLLM({
    prompt,
    model: 'gpt_5_mini',
  });

  return response;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));

    const { recruitEmail, recruitName, typeformData } = body;

    if (!recruitEmail || !typeformData) {
      return Response.json(
        { error: 'recruitEmail and typeformData required' },
        { status: 400 }
      );
    }

    // Generate training plan
    console.log(`Generating training plan for ${recruitName} (${recruitEmail})...`);
    const planContent = await generateTrainingPlan(base44, null, typeformData);

    // Get Gmail access token
    const gmailConn = await base44.asServiceRole.connectors.getConnection('gmail');
    const gmailAccessToken = gmailConn.accessToken;

    // Build HTML email
    const htmlBody = `
<html>
  <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #00E5FF;">🎯 Your Personalized 4-Week Training Plan</h1>
      <p>Hi ${recruitName || 'Recruit'},</p>
      <p>Welcome to Vellera! Based on your onboarding profile, we've crafted a personalized training plan to help you achieve your fitness goals.</p>
      
      <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        ${planContent}
      </div>

      <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
      <p style="color: #666; font-size: 12px;">
        Questions? Reply to this email or visit your Vellera dashboard to adjust your plan.
      </p>
      <p style="color: #666; font-size: 12px;">
        Coach Colin & the Vellera Team
      </p>
    </div>
  </body>
</html>
    `;

    const from = 'noreply@vellera.io';
    const subject = `Your Personalized 4-Week Training Plan - ${recruitName}`;
    const rawMessage = buildMimeEmail(from, recruitEmail, subject, htmlBody);

    // Send via Gmail
    const result = await sendGmailMessage(gmailAccessToken, rawMessage);
    console.log(`Training plan emailed to ${recruitEmail}`);

    return Response.json({
      message: `Training plan sent to ${recruitEmail}`,
      messageId: result.id,
    });
  } catch (error) {
    console.error('sendOnboardingTrainingPlan error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});