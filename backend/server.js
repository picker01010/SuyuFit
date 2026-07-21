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

  const prompt = `You are an expert nutrition label reader. Extract ALL nutrition information from this food label image.

INSTRUCTIONS:
1. Find the product name
2. Find "Serving size" and extract grams (e.g., "28g" or "About 15 chips (28g)")
3. Find "Calories" or "Energy" - get the kcal value
4. Find: Protein, Total Carbohydrate, Total Fat (in grams)
5. Find if available: Fiber, Sugar, Sodium (in mg)
6. Convert ALL values to per 100g basis: (value / serving_grams) × 100

Return ONLY this JSON, no extra text:
{
  "name": "product name from package",
  "per100": {
    "k": calories_per_100g,
    "p": protein_per_100g,
    "c": carbs_per_100g,
    "f": fat_per_100g,
    "fi": fiber_per_100g_or_0,
    "su": sugar_per_100g_or_0,
    "na": sodium_mg_per_100g_or_0
  },
  "serving": {
    "label": "serving size text from label",
    "grams": serving_size_in_grams
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
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      
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
