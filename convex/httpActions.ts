import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

// HTTP action to bulk import anime data
export const bulkImport = httpAction(async (ctx, request) => {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const data = await request.json();
    const { animes } = data;

    if (!Array.isArray(animes)) {
      return new Response(
        JSON.stringify({ error: "Expected 'animes' array" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Import each anime
    const results = [];
    for (const anime of animes) {
      try {
        const id = await ctx.runMutation(api.anime.insert, {
          title: anime.title,
          type: anime.type,
          episodes: anime.episodes,
          status: anime.status,
          animeSeason: anime.animeSeason,
          picture: anime.picture,
          thumbnail: anime.thumbnail,
          duration: anime.duration,
          score: anime.score,
          sources: anime.sources,
          synonyms: anime.synonyms,
          studios: anime.studios,
          producers: anime.producers,
          relatedAnime: anime.relatedAnime,
          tags: anime.tags,
        });
        results.push({ success: true, id, title: anime.title });
      } catch (error) {
        results.push({ 
          success: false, 
          title: anime.title, 
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.length - successCount;

    return new Response(
      JSON.stringify({
        success: true,
        imported: successCount,
        failed: failureCount,
        total: animes.length,
        results,
      }),
      { 
        status: 200, 
        headers: { "Content-Type": "application/json" } 
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : String(error) 
      }),
      { 
        status: 500, 
        headers: { "Content-Type": "application/json" } 
      }
    );
  }
});
