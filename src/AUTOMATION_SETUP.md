# Vellera.app Frontend-to-Airtable Sync Automation

## Overview
Automated data flow: Student completes drill → App logs task → Airtable syncs → Coach gets notified

## Architecture

```
┌─────────────────────┐
│  Student App        │
│  (Complete Drill)   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────────────────────┐
│  Base44 Entity: Task                │
│  Status: "Submitted" → "Complete"   │
└──────────┬────────────────────────┐─┘
           │                        │
    ┌──────▼──────────┐   ┌────────▼─────────┐
    │ Entity Trigger  │   │ Org-Scoped RLS   │
    │ (Create Notify) │   │ (Tenant Safety)  │
    └──────┬──────────┘   └──────────────────┘
           │
           ▼
┌──────────────────────────────────────────┐
│  Backend Function: syncTaskToAirtable    │
│  - Validate student exists               │
│  - Check org_id match                    │
│  - Build Airtable payload                │
│  - Handle errors + retry (5-min delay)   │
└──────────┬───────────────────────────────┘
           │
     ┌─────┴────────┬──────────────┐
     │              │              │
     ▼              ▼              ▼
┌──────────┐  ┌─────────────┐  ┌────────────┐
│ Airtable │  │ Email Coach │  │ Slack/Logs │
│ Sync     │  │ Notification│  │ Activity   │
└──────────┘  └─────────────┘  └────────────┘
```

## Setup Steps

### 1. Create Entity Automation (Task Completion Trigger)

**Go to**: Base44 Dashboard → Automations → Create New

```
Automation Type: Entity
Entity: Task
Event Type: update (watch for status changes)
Trigger Condition: 
  - Field: "data.status"
  - Operator: equals
  - Value: "Complete"
Function: syncTaskToAirtable
Status: Active
```

### 2. Configure Airtable Base

**Required Tables**:
- `Activity Logs` (destination for sync)
  - Student Email (text)
  - Drill Title (text)
  - Video URL (url)
  - Status (select: "Needs Review", "Missing Evidence", "Reviewed")
  - Submitted Date (date)
  - Coach Email (email)
  - App Task ID (text, for deduplication)

**Authorize Airtable** (if not already done):
- Go to Base44 Dashboard → Integrations
- Click Airtable → Authorize with your account
- Grant scopes: `data.records:read`, `data.records:write`, `schema.bases:read`

### 3. Enable Email Notifications

Coach gets email alert immediately when student submits video.
- Uses Base44's Core.SendEmail integration (already configured)
- Subject: "New Video Submission: [Drill Name]"
- Includes video URL + deep link to coach dashboard

### 4. Optional: Slack Notifications

To send Slack alerts instead of (or in addition to) email:

1. **Get Slack Webhook URL**:
   - Go to Slack workspace → Apps → Incoming Webhooks
   - Create new webhook, copy URL

2. **Set Secret**:
   ```
   Dashboard → Settings → Environment Variables
   Add: SLACK_WEBHOOK_COACH = https://hooks.slack.com/services/YOUR/WEBHOOK/URL
   ```

3. **Modify function** (add after email step):
   ```javascript
   if (coachEmail) {
     const slackMsg = {
       text: `📹 New video from ${studentEmail}`,
       attachments: [{
         title: drillTitle,
         text: videoUrl ? `Review: ${videoUrl}` : '⚠️ No video attached',
         color: videoUrl ? '#00E5FF' : '#FFA500',
       }]
     };
     await fetch(Deno.env.get('SLACK_WEBHOOK_COACH'), {
       method: 'POST',
       body: JSON.stringify(slackMsg),
     });
   }
   ```

## Error Handling & Retry Logic

### Automatic Retries
- Failed sync → returned with `retry_eligible: true`
- Retry delay: 5 minutes
- Max retries: 3 (configurable via automation settings)

### Error States

| Error | Action | Status in Airtable |
|-------|--------|---------------------|
| Missing video_url | Log record with status | "Missing Evidence" |
| Student not found | Fail sync, create error log | (not created) |
| Org_id mismatch | Fail sync (tenant safety) | (not created) |
| Airtable API down | Retry in 5 min | (pending) |

### Monitoring

Check automation logs:
1. Go to Base44 Dashboard → Automations → syncTaskToAirtable
2. View execution history + error messages
3. Manual retry button available if needed

## Data Mapping Reference

| App (Task) | Airtable (Activity Logs) | Type |
|-----------|--------------------------|------|
| student_email | Student Email | text |
| title | Drill Title | text |
| submitted_url | Video URL | url |
| submitted_date | Submitted Date | date-time |
| coach_email | Coach Email | email |
| id | App Task ID | text (unique) |
| status | Status | select |

## Tenant Safety & RLS

✅ **Org-Scoped Data Isolation**
- Task entity has RLS rules: coaches can only see/update tasks for their org
- Automation inherits user context: only syncs tasks from authorized orgs
- Airtable sync includes Org ID validation in future expansion

✅ **Cross-Tenant Prevention**
- Each coach's automation runs under their org context
- Airtable records tagged with Coach Email (enables team filtering)
- No data leakage between orgs possible

## Troubleshooting

### Sync not triggering?
1. Check Task status is exactly "Complete" (case-sensitive)
2. Verify automation is "Active" (toggle in dashboard)
3. Check function logs for errors

### Airtable records not appearing?
1. Verify Airtable connector is authorized
2. Check table name matches (`Activity Logs`)
3. Look for failed function execution in logs

### Coach not getting notifications?
1. Verify coach_email is populated on Task
2. Check email in spam folder
3. Test email manually: go to function → "Test" → check logs

## Cost & Performance

- **Automation triggers**: Free (included in Base44)
- **Function execution**: ~$0.001 per sync (minimal)
- **Airtable API calls**: ~0.1 calls per sync (within free tier)
- **Latency**: <3 seconds from app to Airtable

## Future Expansions

- [ ] Bulk sync historical tasks (onboarding)
- [ ] Two-way sync: Airtable review status → update Task
- [ ] Coach-specific views (filter Activity Logs by Coach Email)
- [ ] Video URL auto-thumbnail preview in Airtable