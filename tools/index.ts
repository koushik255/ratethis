import { Elysia } from "elysia";
import { ConvexClient } from "convex/browser";
import { api } from "../convex/_generated/api";

const CONVEX_URL = "https://pastel-condor-398.convex.cloud";
const convex = new ConvexClient(CONVEX_URL);

const app = new Elysia()
  .get("/sync/:username", async ({ params }) => {
    const { username } = params;
    
    console.log(`\n=== Starting MAL sync for user: ${username} ===\n`);
    
    const pythonPath = "./mal-scraper/.venv/bin/python";
    const scraperPath = "./mal-scraper/scraper.py";
    
    const proc = Bun.spawn([pythonPath, scraperPath, username, "anime", "2"], {
      stdout: "pipe",
      stderr: "inherit",
    });
    
    const reader = proc.stdout.getReader();
    const decoder = new TextDecoder();
    const animeTitles: string[] = [];
    
    // Read all stdout from Python scraper
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split("\n");
      
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith("Fetching") && !trimmed.startsWith("Found") && !trimmed.startsWith("Total")) {
          animeTitles.push(trimmed);
        }
      }
    }
    
    console.log(`\n=== Found ${animeTitles.length} completed anime ===\n`);
    
    let foundCount = 0;
    
    // Query Convex for each anime
    for (const animeTitle of animeTitles) {
      process.stdout.write(`anime:${animeTitle} ->> Checking Db ->> `);
      
      try {
        const result = await convex.query(api.anime.getTopMatchByTitle, { title: animeTitle });
        
        if (result) {
          console.log(`found "${result.title}" Convexid:${result._id}`);
          foundCount++;
        } else {
          console.log("not found");
        }
      } catch (error) {
        console.log(`error: ${error instanceof Error ? error.message : String(error)}`);
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    console.log(`\n=== Sync complete for ${username} ===`);
    console.log(`found ${foundCount} matches for ${animeTitles.length} animes found\n`);
    
    return new Response(null, { status: 200 });
  });

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Endpoint: GET /sync/:username`);
});
