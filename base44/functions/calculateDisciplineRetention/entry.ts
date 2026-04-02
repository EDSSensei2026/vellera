import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 86400000);

    // Fetch all training sessions in last 30 days
    const sessions = await base44.asServiceRole.entities.TrainingSession.list('-date', 500);
    const recentSessions = sessions.filter(s => {
      const sDate = new Date(s.date);
      return sDate >= thirtyDaysAgo && sDate <= today;
    });

    // Fetch all user profiles with fitness path
    const allProfiles = await base44.asServiceRole.entities.UserProfile.list('', 500);

    // Map sessions by user email
    const sessionsByUser = {};
    for (const session of recentSessions) {
      const email = session.created_by;
      if (!sessionsByUser[email]) sessionsByUser[email] = [];
      sessionsByUser[email].push(new Date(session.date));
    }

    // Calculate retention by discipline
    const disciplines = {};

    for (const profile of allProfiles) {
      const email = profile.created_by;
      const discipline = profile.fitness_path || 'general';

      if (!disciplines[discipline]) {
        disciplines[discipline] = {
          totalUsers: 0,
          activeInFirst15: 0,
          activeInLast15: 0,
          activeInBoth: 0,
          activeWeekly: new Map(),
        };
      }

      disciplines[discipline].totalUsers += 1;

      const userSessions = sessionsByUser[email] || [];
      if (userSessions.length === 0) continue;

      const first15Date = new Date(thirtyDaysAgo.getTime() + 15 * 86400000);
      const activeFirst15 = userSessions.some(d => d < first15Date);
      const activeLast15 = userSessions.some(d => d >= first15Date);

      if (activeFirst15) disciplines[discipline].activeInFirst15 += 1;
      if (activeLast15) disciplines[discipline].activeInLast15 += 1;
      if (activeFirst15 && activeLast15) disciplines[discipline].activeInBoth += 1;

      // Weekly breakdown
      for (const session of userSessions) {
        const weekNum = Math.floor((session - thirtyDaysAgo) / (7 * 86400000));
        if (!disciplines[discipline].activeWeekly.has(weekNum)) {
          disciplines[discipline].activeWeekly.set(weekNum, new Set());
        }
        disciplines[discipline].activeWeekly.get(weekNum).add(email);
      }
    }

    // Calculate percentages
    const results = {};
    for (const [discipline, data] of Object.entries(disciplines)) {
      const retention30d = data.activeInFirst15 > 0 
        ? Math.round((data.activeInBoth / data.activeInFirst15) * 100) 
        : 0;

      const weeklyRetention = [];
      for (let w = 0; w < 3; w++) {
        const week1Users = data.activeWeekly.get(w)?.size || 0;
        const week2Users = data.activeWeekly.get(w + 1)?.size || 0;
        const shared = week1Users > 0 && week2Users > 0 
          ? [...(data.activeWeekly.get(w) || new Set())].filter(u => data.activeWeekly.get(w + 1)?.has(u)).length
          : 0;
        const weekRetention = week1Users > 0 ? Math.round((shared / week1Users) * 100) : 0;
        weeklyRetention.push({ week: w + 1, retention: weekRetention, activeUsers: week1Users });
      }

      results[discipline] = {
        totalUsers: data.totalUsers,
        activeUsers: data.activeInFirst15,
        retention30d,
        retention7dAvg: Math.round(weeklyRetention.reduce((sum, w) => sum + w.retention, 0) / weeklyRetention.length || 0),
        weeklyRetention,
      };
    }

    return Response.json({ success: true, disciplines: results });
  } catch (error) {
    console.error('[Retention Calculation Error]', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});