import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin only' }, { status: 403 });
    }

    // Get current month in YYYY-MM format
    const now = new Date();
    const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const monthStart = new Date(`${yearMonth}-01`);
    const monthEnd = new Date(monthStart);
    monthEnd.setMonth(monthEnd.getMonth() + 1);

    // Get all users
    const users = await base44.asServiceRole.entities.User.list();
    const results = [];

    for (const u of users) {
      // Get all sessions for this user this month
      const sessions = await base44.asServiceRole.entities.TrainingSession.filter({
        created_by: u.email,
        date: { $gte: monthStart.toISOString().split('T')[0], $lt: monthEnd.toISOString().split('T')[0] }
      });

      if (sessions.length === 0) continue;

      const totalSessions = sessions.length;
      const totalMinutes = sessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
      const categories = [...new Set(sessions.map(s => s.session_type).filter(Boolean))];

      // Get current streak from UserProfile
      const profiles = await base44.asServiceRole.entities.UserProfile.filter({ created_by: u.email });
      const streakDays = profiles[0]?.current_streak_days || 0;

      // Calculate consistency score (0-100)
      // 40% sessions (max 20 sessions = 100%)
      // 40% minutes (max 500 minutes = 100%)
      // 20% streak (max 30 days = 100%)
      const sessionScore = Math.min(100, (totalSessions / 20) * 100);
      const minuteScore = Math.min(100, (totalMinutes / 500) * 100);
      const streakScore = Math.min(100, (streakDays / 30) * 100);
      const consistencyScore = Math.round((sessionScore * 0.4) + (minuteScore * 0.4) + (streakScore * 0.2));

      // Check if record already exists
      const existing = await base44.asServiceRole.entities.MonthlyConsistency.filter({
        user_email: u.email,
        year_month: yearMonth
      });

      const data = {
        user_email: u.email,
        user_name: u.full_name,
        year_month: yearMonth,
        total_sessions: totalSessions,
        total_minutes: totalMinutes,
        streak_days: streakDays,
        consistency_score: consistencyScore,
        categories_trained: categories,
        avg_session_duration: Math.round(totalMinutes / totalSessions),
      };

      if (existing.length > 0) {
        await base44.asServiceRole.entities.MonthlyConsistency.update(existing[0].id, data);
        results.push({ action: 'updated', user: u.email, score: consistencyScore });
      } else {
        await base44.asServiceRole.entities.MonthlyConsistency.create(data);
        results.push({ action: 'created', user: u.email, score: consistencyScore });
      }
    }

    return Response.json({
      success: true,
      month: yearMonth,
      records_processed: results.length,
      details: results
    });
  } catch (error) {
    console.error('Monthly consistency calculation failed:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});