import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';
const SPOTIFY_AUTH = 'https://accounts.spotify.com/api/token';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const apiKey = Deno.env.get('SPOTIFY_API_KEY');
    if (!apiKey) {
      return Response.json({ error: 'Spotify API key not configured' }, { status: 500 });
    }

    const { action, query } = await req.json();

    // Get access token using Client Credentials flow
    const tokenRes = await fetch(SPOTIFY_AUTH, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${apiKey}:`)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    if (!tokenRes.ok) {
      return Response.json({ error: 'Failed to authenticate with Spotify' }, { status: 500 });
    }

    const { access_token } = await tokenRes.json();

    // Search for playlists or tracks
    if (action === 'search') {
      const searchRes = await fetch(
        `${SPOTIFY_API_BASE}/search?q=${encodeURIComponent(query)}&type=playlist,track&limit=20`,
        {
          headers: { 'Authorization': `Bearer ${access_token}` },
        }
      );

      const data = await searchRes.json();
      return Response.json({
        playlists: data.playlists?.items || [],
        tracks: data.tracks?.items || [],
      });
    }

    // Get playlist tracks
    if (action === 'playlist') {
      const playlistRes = await fetch(
        `${SPOTIFY_API_BASE}/playlists/${query}`,
        {
          headers: { 'Authorization': `Bearer ${access_token}` },
        }
      );

      const playlist = await playlistRes.json();
      const tracksRes = await fetch(
        `${SPOTIFY_API_BASE}/playlists/${query}/tracks?limit=50`,
        {
          headers: { 'Authorization': `Bearer ${access_token}` },
        }
      );

      const tracksData = await tracksRes.json();
      return Response.json({
        name: playlist.name,
        image: playlist.images?.[0]?.url,
        tracks: tracksData.items?.map(item => ({
          id: item.track.id,
          name: item.track.name,
          artist: item.track.artists?.[0]?.name,
          image: item.track.album?.images?.[0]?.url,
          url: item.track.external_urls?.spotify,
          previewUrl: item.track.preview_url,
        })) || [],
      });
    }

    // Featured playlists
    if (action === 'featured') {
      const featuredRes = await fetch(
        `${SPOTIFY_API_BASE}/browse/featured-playlists?limit=20`,
        {
          headers: { 'Authorization': `Bearer ${access_token}` },
        }
      );

      const data = await featuredRes.json();
      return Response.json({
        playlists: data.playlists?.items?.map(p => ({
          id: p.id,
          name: p.name,
          image: p.images?.[0]?.url,
          description: p.description,
        })) || [],
      });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});