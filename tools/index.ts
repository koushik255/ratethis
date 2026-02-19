import { Elysia } from "elysia";
import { ConvexClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";

const CONVEX_URL = process.env.CONVEX_URL || "https://pastel-condor-398.convex.cloud";
const convex = new ConvexClient(CONVEX_URL);

interface SyncRequest {
  malUsername: string;
  userId: string;
}

interface SyncResponse {
  success: boolean;
  imported: number;
  skipped: number;
  notFound: string[];
  total: number;
  error?: string;
}

async function scrapeMalList(username: string): Promise<string[]> {
  const pythonPath = "./mal-scraper/.venv/bin/python";
  const scraperPath = "./mal-scraper/scraper.py";
  
  const proc = Bun.spawn([pythonPath, scraperPath, username, "anime", "2"], {
    stdout: "pipe",
    stderr: "pipe",
  });
  
  const reader = proc.stdout.getReader();
  const decoder = new TextDecoder();
  const animeTitles: string[] = [];
  
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
  
  await proc.exited;
  
  return animeTitles;
}

const app = new Elysia()
  .onRequest(({ request, set }) => {
    set.headers["Access-Control-Allow-Origin"] = "*";
    set.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS";
    set.headers["Access-Control-Allow-Headers"] = "Content-Type";
    
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204 });
    }
  })
  .post("/sync", async ({ body }): Promise<SyncResponse> => {
    const { malUsername, userId } = body as SyncRequest;
    
    if (!malUsername || !userId) {
      return {
        success: false,
        imported: 0,
        skipped: 0,
        notFound: [],
        total: 0,
        error: "Missing malUsername or userId",
      };
    }
    
    console.log(`\n=== Starting MAL sync for: ${malUsername} (userId: ${userId}) ===\n`);
    
    try {
      const animeTitles = await scrapeMalList(malUsername);
      
      console.log(`Found ${animeTitles.length} completed anime on MAL`);
      
      if (animeTitles.length === 0) {
        return {
          success: true,
          imported: 0,
          skipped: 0,
          notFound: [],
          total: 0,
        };
      }
      
      const foundIds: Id<"anime">[] = [];
      const notFound: string[] = [];
      
      for (const title of animeTitles) {
        try {
          const result = await convex.query(api.anime.getTopMatchByTitle, { title });
          
          if (result) {
            foundIds.push(result._id);
            console.log(`✓ "${title}" -> "${result.title}"`);
          } else {
            notFound.push(title);
            console.log(`✗ "${title}" not found in database`);
          }
        } catch (error) {
          notFound.push(title);
          console.log(`✗ "${title}" error: ${error}`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      console.log(`\nMatched ${foundIds.length}/${animeTitles.length} anime`);
      
      if (foundIds.length > 0) {
        console.log("Marking as watched in Convex...");
        
        const bulkResult = await convex.mutation(api.userAnime.bulkMarkAsWatched, {
          userId,
          animeIds: foundIds,
        });
        
        console.log(`Imported: ${bulkResult.imported}, Skipped (already watched): ${bulkResult.skipped}`);
        
        return {
          success: true,
          imported: bulkResult.imported,
          skipped: bulkResult.skipped,
          notFound,
          total: animeTitles.length,
        };
      }
      
      return {
        success: true,
        imported: 0,
        skipped: 0,
        notFound,
        total: animeTitles.length,
      };
      
    } catch (error) {
      console.error("Sync error:", error);
      return {
        success: false,
        imported: 0,
        skipped: 0,
        notFound: [],
        total: 0,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  })
  .get("/health", () => ({ status: "ok" }));

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Tools server running on http://localhost:${PORT}`);
  console.log(`Endpoints:`);
  console.log(`  POST /sync - Import MAL completed list`);
  console.log(`  GET  /health - Health check`);
});
