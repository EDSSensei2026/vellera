import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    const body = await req.json();
    const category = body.category || null;

    // Fetch all exercises or filtered by category
    let exercises;
    if (category) {
      exercises = await base44.entities.ExerciseLibrary.filter(
        { category: category },
        { limit: 50 }
      );
    } else {
      exercises = await base44.entities.ExerciseLibrary.list('-created_date', 50);
    }

    console.log(`[Movement Library] Fetched ${exercises.length} exercises${category ? ` (${category})` : ''}`);

    return Response.json({
      success: true,
      exercises: exercises,
      count: exercises.length,
      category: category || 'All',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Movement Library Error]', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});