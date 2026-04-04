import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('google_search_console');

    // Get list of verified sites
    const sitesRes = await fetch('https://www.googleapis.com/webmasters/v3/sites', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const sitesData = await sitesRes.json();
    const sites = sitesData.siteEntry || [];

    if (sites.length === 0) {
      return Response.json({ error: 'No verified sites found in Search Console.' }, { status: 404 });
    }

    // Use first verified site
    const siteUrl = sites[0].siteUrl;

    // Date range: last 28 days
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 28 * 86400000).toISOString().split('T')[0];

    // Fetch overall performance
    const perfRes = await fetch(
      `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ startDate, endDate, dimensions: ['date'], rowLimit: 28 }),
      }
    );
    const perfData = await perfRes.json();

    // Fetch top queries
    const queriesRes = await fetch(
      `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ startDate, endDate, dimensions: ['query'], rowLimit: 10 }),
      }
    );
    const queriesData = await queriesRes.json();

    // Fetch top pages
    const pagesRes = await fetch(
      `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ startDate, endDate, dimensions: ['page'], rowLimit: 10 }),
      }
    );
    const pagesData = await pagesRes.json();

    // Aggregate totals
    const rows = perfData.rows || [];
    const totalClicks = rows.reduce((s, r) => s + r.clicks, 0);
    const totalImpressions = rows.reduce((s, r) => s + r.impressions, 0);
    const avgCTR = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : 0;
    const avgPosition = rows.length > 0
      ? (rows.reduce((s, r) => s + r.position, 0) / rows.length).toFixed(1)
      : 0;

    console.log(`Search Console sync for ${siteUrl}: ${totalClicks} clicks, ${totalImpressions} impressions`);

    return Response.json({
      siteUrl,
      dateRange: { startDate, endDate },
      summary: { totalClicks, totalImpressions, avgCTR: parseFloat(avgCTR), avgPosition: parseFloat(avgPosition) },
      dailyData: rows.map(r => ({ date: r.keys[0], clicks: r.clicks, impressions: r.impressions, ctr: parseFloat((r.ctr * 100).toFixed(2)), position: parseFloat(r.position.toFixed(1)) })),
      topQueries: (queriesData.rows || []).map(r => ({ query: r.keys[0], clicks: r.clicks, impressions: r.impressions, ctr: parseFloat((r.ctr * 100).toFixed(2)), position: parseFloat(r.position.toFixed(1)) })),
      topPages: (pagesData.rows || []).map(r => ({ page: r.keys[0], clicks: r.clicks, impressions: r.impressions, ctr: parseFloat((r.ctr * 100).toFixed(2)), position: parseFloat(r.position.toFixed(1)) })),
    });
  } catch (error) {
    console.error('searchConsoleSync error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});