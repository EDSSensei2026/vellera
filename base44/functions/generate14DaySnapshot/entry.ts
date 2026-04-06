import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import { jsPDF } from 'npm:jspdf@4.0.0';

/**
 * generate14DaySnapshot
 * Creates a single-page "14-Day Clinical Snapshot" PDF for doctor visits.
 * Aggregates WellnessLog + ClinicalAssessment data for the requesting user.
 *
 * Usage: base44.functions.invoke('generate14DaySnapshot', { patient_email })
 * - patient_email: admin/clinician can specify; otherwise uses authenticated user
 * Returns: PDF as base64 string + summary stats
 */

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const isPrivileged = user.role === 'admin' || user.role === 'clinician';
  const targetEmail = (isPrivileged && body.patient_email) ? body.patient_email : user.email;

  // 14-day window
  const now = new Date();
  const windowStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const windowStartDate = windowStart.toISOString().split('T')[0];

  // ── Fetch data ────────────────────────────────────────────────────────────
  const [wellnessLogs, assessments] = await Promise.all([
    base44.asServiceRole.entities.WellnessLog.filter({ user_email: targetEmail }),
    base44.asServiceRole.entities.ClinicalAssessment.filter({ patient_email: targetEmail }),
  ]);

  // Filter to 14-day window
  const recentWellness    = wellnessLogs.filter(l => l.log_date >= windowStartDate).sort((a, b) => a.log_date.localeCompare(b.log_date));
  const recentAssessments = assessments.filter(a => a.assessment_date >= windowStartDate);

  // ── Compute stats ─────────────────────────────────────────────────────────
  const avgPain     = recentWellness.length ? (recentWellness.reduce((s, l) => s + (l.pain_vas || 0), 0) / recentWellness.length).toFixed(1) : 'N/A';
  const avgMood     = recentWellness.length ? (recentWellness.reduce((s, l) => s + (l.mood_score || 0), 0) / recentWellness.length).toFixed(1) : 'N/A';
  const avgSleep    = recentWellness.length ? (recentWellness.reduce((s, l) => s + (l.sleep_hours || 0), 0) / recentWellness.length).toFixed(1) : 'N/A';
  const avgReadiness= recentWellness.length ? (recentWellness.reduce((s, l) => s + (l.readiness_score || 0), 0) / recentWellness.length).toFixed(0) : 'N/A';
  const flaggedDays = recentWellness.filter(l => l.flagged).length;
  const highPainDays= recentWellness.filter(l => (l.pain_vas || 0) >= 7).length;

  const lastBeighton = recentAssessments.filter(a => a.beighton_score != null).sort((a, b) => b.assessment_date.localeCompare(a.assessment_date))[0];
  const lastLEFS     = recentAssessments.filter(a => a.lefs_score != null).sort((a, b) => b.assessment_date.localeCompare(a.assessment_date))[0];

  // ── Build PDF ─────────────────────────────────────────────────────────────
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = 210;
  const margin = 15;
  let y = margin;

  // Header band
  doc.setFillColor(18, 18, 18);
  doc.rect(0, 0, pageW, 32, 'F');
  doc.setTextColor(0, 229, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('14-Day Clinical Snapshot', margin, 14);
  doc.setFontSize(9);
  doc.setTextColor(180, 180, 180);
  doc.text(`Patient: ${targetEmail}`, margin, 21);
  doc.text(`Period: ${windowStartDate} → ${now.toISOString().split('T')[0]}`, margin, 27);
  doc.text(`Generated: ${now.toLocaleString()} by ${user.email}`, pageW - margin, 27, { align: 'right' });

  y = 40;

  // Divider helper
  const divider = () => {
    doc.setDrawColor(50, 50, 50);
    doc.line(margin, y, pageW - margin, y);
    y += 5;
  };

  // Section header helper
  const sectionHeader = (title) => {
    doc.setFillColor(30, 35, 45);
    doc.rect(margin - 2, y - 4, pageW - (margin * 2) + 4, 9, 'F');
    doc.setTextColor(0, 229, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(title, margin, y + 2);
    y += 10;
  };

  // Stat row helper
  const statRow = (label, value, warning = false) => {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120, 120, 120);
    doc.text(label, margin + 2, y);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(warning ? 220 : 200, warning ? 60 : 200, warning ? 60 : 200);
    doc.text(String(value), margin + 70, y);
    y += 6;
  };

  // ── Section 1: Wellness Summary ───────────────────────────────────────────
  sectionHeader('WELLNESS METRICS — 14-DAY AVERAGE');
  statRow('Days Logged', `${recentWellness.length} / 14`);
  statRow('Avg Pain Score (VAS 0-10)', avgPain, parseFloat(avgPain) >= 5);
  statRow('Avg Mood (1-5)', avgMood);
  statRow('Avg Sleep Duration (hrs)', avgSleep, parseFloat(avgSleep) < 6);
  statRow('Avg Training Readiness (%)', avgReadiness);
  statRow('Clinician-Flagged Days', flaggedDays, flaggedDays > 0);
  statRow('High Pain Days (VAS ≥ 7)', highPainDays, highPainDays > 2);
  y += 3;

  // ── Section 2: Daily Pain Chart (text-based sparkline) ───────────────────
  divider();
  sectionHeader('DAILY PAIN LOG (VAS)');
  if (recentWellness.length > 0) {
    const sparkCols = 7;
    let col = 0;
    recentWellness.forEach(log => {
      const x = margin + 2 + (col % sparkCols) * 26;
      const rowOffset = Math.floor(col / sparkCols) * 12;
      const painVal = log.pain_vas ?? 0;
      const isHigh = painVal >= 7;
      doc.setFontSize(7);
      doc.setTextColor(100, 100, 100);
      doc.text(log.log_date.slice(5), x, y + rowOffset);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(isHigh ? 220 : painVal >= 4 ? 200 : 80, isHigh ? 60 : painVal >= 4 ? 140 : 180, isHigh ? 60 : 60);
      doc.text(`${painVal}`, x + 12, y + rowOffset);
      doc.setFont('helvetica', 'normal');
      col++;
    });
    y += Math.ceil(recentWellness.length / sparkCols) * 12 + 4;
  } else {
    doc.setTextColor(120, 120, 120);
    doc.setFontSize(9);
    doc.text('No wellness logs in this period.', margin + 2, y);
    y += 8;
  }

  // ── Section 3: Clinical Assessments ──────────────────────────────────────
  divider();
  sectionHeader('CLINICAL ASSESSMENTS');
  if (lastBeighton) {
    statRow('Beighton Hypermobility Score', `${lastBeighton.beighton_score}/9 (${lastBeighton.assessment_date})`, lastBeighton.beighton_score >= 6);
  }
  if (lastLEFS) {
    const lefsInterp = lastLEFS.lefs_score >= 60 ? 'Minimal Disability' : lastLEFS.lefs_score >= 40 ? 'Moderate Disability' : 'Severe Disability';
    statRow('LEFS Score', `${lastLEFS.lefs_score}/80 — ${lefsInterp} (${lastLEFS.assessment_date})`, lastLEFS.lefs_score < 40);
  }
  if (!lastBeighton && !lastLEFS) {
    doc.setTextColor(120, 120, 120);
    doc.setFontSize(9);
    doc.text('No clinical assessments completed in this period.', margin + 2, y);
    y += 8;
  }
  y += 3;

  // ── Section 4: Symptom Summary ────────────────────────────────────────────
  divider();
  sectionHeader('REPORTED SYMPTOMS');
  const allSymptoms = recentWellness.flatMap(l => l.symptoms || []);
  if (allSymptoms.length > 0) {
    const symCount = allSymptoms.reduce((acc, s) => { acc[s] = (acc[s] || 0) + 1; return acc; }, {});
    const sorted = Object.entries(symCount).sort((a, b) => b[1] - a[1]);
    sorted.forEach(([sym, count]) => statRow(sym, `${count} day(s)`));
  } else {
    doc.setTextColor(120, 120, 120);
    doc.setFontSize(9);
    doc.text('No symptoms reported.', margin + 2, y);
    y += 8;
  }
  y += 3;

  // ── Footer ────────────────────────────────────────────────────────────────
  const footerY = 285;
  doc.setFillColor(18, 18, 18);
  doc.rect(0, footerY - 3, pageW, 15, 'F');
  doc.setFontSize(7);
  doc.setTextColor(100, 100, 100);
  doc.text('CONFIDENTIAL — For clinical use only. This report is generated from patient-reported data and does not constitute a medical diagnosis.', margin, footerY + 3);
  doc.text('Vellera Clinical Suite · FHIR-aligned · EDS-Compliant', pageW - margin, footerY + 3, { align: 'right' });

  // Output PDF as base64
  const pdfBase64 = doc.output('datauristring');

  console.log(`[generate14DaySnapshot] PDF generated for ${targetEmail}: ${recentWellness.length} wellness logs, ${recentAssessments.length} assessments`);

  return Response.json({
    success: true,
    pdf_base64: pdfBase64,
    filename: `clinical_snapshot_${targetEmail.split('@')[0]}_${now.toISOString().split('T')[0]}.pdf`,
    summary: {
      patient: targetEmail,
      period_start: windowStartDate,
      period_end: now.toISOString().split('T')[0],
      wellness_logs: recentWellness.length,
      assessments: recentAssessments.length,
      avg_pain: avgPain,
      avg_mood: avgMood,
      avg_sleep: avgSleep,
      flagged_days: flaggedDays,
      high_pain_days: highPainDays,
    },
  });
});