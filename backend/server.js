require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { createClient } = require("@supabase/supabase-js");

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// ── Supabase (optional for sync) ──────────────────────────────────────────────
let supabase = null;
if (process.env.SUPABASE_URL && process.env.SUPABASE_URL.startsWith('http')) {
  supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );
}

// ── Gemini key rotation (4 KEYS FOR MAXIMUM POWER) ────────────────────────────
const GEMINI_KEYS = [
  process.env.GEMINI_KEY,
  process.env.GEMINI_KEY_2,
  process.env.GEMINI_KEY_3,
  process.env.GEMINI_KEY_4,
].filter(Boolean);

console.log(`🚀 Loaded ${GEMINI_KEYS.length} Gemini keys`);

let keyIdx = 0;
function nextGeminiKey() {
  const key = GEMINI_KEYS[keyIdx % GEMINI_KEYS.length];
  keyIdx++;
  return key;
}

async function geminiWithFallback(fn) {
  let lastErr;
  for (let attempt = 0; attempt < GEMINI_KEYS.length; attempt++) {
    const key = nextGeminiKey();
    try {
      return await fn(key);
    } catch (e) {
      lastErr = e;
      console.log(`❌ Gemini key ${attempt + 1} failed:`, e.message);
      // If quota/rate limit, try next key
      if (e.message?.includes("quota") || e.message?.includes("rate")) {
        console.log(`→ Trying next key...`);
        continue;
      }
      // Other errors, throw immediately
      throw e;
    }
  }
  throw lastErr;
}

// ── AI NUTRITION SCANNER (GEMINI ONLY) ────────────────────────────────────────
app.post("/api/scan", async (req, res) => {
  const { imageBase64 } = req.body;
  if (!imageBase64) return res.status(400).json({ ok: false, error: "No image provided" });

  console.log("📸 New scan request received");

  const prompt = `You are an EXPERT nutrition label reader. Extract EXACT values from the nutrition facts label.

CRITICAL INSTRUCTIONS:
1. Read EXACTLY what's printed on the label - do NOT estimate or round
2. Find "Serving size" - extract the EXACT gram amount (e.g., "28g" or "About 15 chips (28g)")
3. Find "Calories" or "Energy" - use the EXACT kcal number shown
4. Find macros: Total Fat, Protein, Total Carbohydrate - EXACT grams as printed
5. Find: Fiber, Sugar, Sodium - EXACT values if shown
6. Convert ALL values to per 100g using EXACT math: (value ÷ serving_grams) × 100
7. Keep 1 decimal place for precision

EXAMPLES:
- Label shows "Serving: 28g, Calories: 150" → per 100g kcal = (150 ÷ 28) × 100 = 535.7
- Label shows "Serving: 30g, Protein: 5g" → per 100g protein = (5 ÷ 30) × 100 = 16.7

Return ONLY this JSON with EXACT calculated values, no text before/after:
{
  "name": "exact product name from package",
  "per100": {
    "k": 535.7,
    "p": 16.7,
    "c": 53.6,
    "f": 28.6,
    "fi": 3.6,
    "su": 7.1,
    "na": 357
  },
  "serving": {
    "label": "exact serving text from label",
    "grams": 28
  }
}`;

  let imageData = imageBase64;
  
  // Extract base64 data (remove data:image/... prefix if present)
  if (imageData.includes(",")) {
    imageData = imageData.split(",")[1];
  }

  try {
    const result = await geminiWithFallback(async (apiKey) => {
      console.log(`🔑 Trying Gemini API...`);
      
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash",
        generationConfig: {
          temperature: 0, // No creativity - exact reading only
        }
      });
      
      const response = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: imageData,
            mimeType: "image/jpeg",
          },
        },
      ]);
      
      const text = response.response.text();
      console.log("📝 Gemini response:", text.substring(0, 300));
      
      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in response");
      }
      
      const parsed = JSON.parse(jsonMatch[0]);
      
      // Validate response has required fields
      if (!parsed.per100 || typeof parsed.per100.k !== 'number') {
        throw new Error("Invalid response format - missing nutrition data");
      }
      
      console.log("✅ SUCCESS! Extracted:", parsed.name);
      return parsed;
    });

    res.json({ ok: true, data: result, ai: "gemini" });
    
  } catch (e) {
    console.error("❌ ALL GEMINI KEYS FAILED:", e.message);
    console.error("Full error:", e);
    res.json({ 
      ok: false, 
      error: "Could not read the label. Try a clearer, well-lit photo showing the nutrition facts clearly.",
      debug: e.message
    });
  }
});

// ── Sync endpoints ────────────────────────────────────────────────────────────
// Save full state snapshot for a user
app.post("/api/sync", async (req, res) => {
  if (!supabase) return res.status(503).json({ error: "Sync not configured" });
  const { userId, state } = req.body;
  if (!userId || !state) return res.status(400).json({ error: "Missing userId or state" });
  const { error } = await supabase
    .from("sync")
    .upsert({ user_id: userId, state, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

// Load state for a user
app.get("/api/sync/:userId", async (req, res) => {
  if (!supabase) return res.status(503).json({ error: "Sync not configured" });
  const { data, error } = await supabase
    .from("sync")
    .select("state, updated_at")
    .eq("user_id", req.params.userId)
    .single();
  if (error) return res.status(404).json({ error: "Not found" });
  res.json({ ok: true, state: data.state, updatedAt: data.updated_at });
});

// Health check (UptimeRobot pings this)
app.get("/health", (_req, res) => res.json({ ok: true, ts: Date.now() }));

// Debug endpoint to check which AI providers are configured
app.get("/api/debug/providers", (_req, res) => {
  res.json({
    gemini: !!process.env.GEMINI_KEY,
    openai: !!process.env.OPENAI_KEY,
    groq: GROQ_KEYS.length,
    geminiPrefix: process.env.GEMINI_KEY?.substring(0, 10),
    openaiPrefix: process.env.OPENAI_KEY?.substring(0, 15),
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`SuyuFit backend running on ${PORT}`));
