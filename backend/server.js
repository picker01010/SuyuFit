require("dotenv").config();
const express = require("express");
const cors = require("cors");
const Groq = require("groq-sdk");
const { createClient } = require("@supabase/supabase-js");

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// ── Supabase ──────────────────────────────────────────────────────────────────
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// ── Groq key rotation ─────────────────────────────────────────────────────────
const GROQ_KEYS = [
  process.env.GROQ_KEY_1,
  process.env.GROQ_KEY_2,
  process.env.GROQ_KEY_3,
].filter(Boolean);

let keyIdx = 0;
function nextGroqClient() {
  const key = GROQ_KEYS[keyIdx % GROQ_KEYS.length];
  keyIdx++;
  return new Groq({ apiKey: key });
}

async function groqWithFallback(fn) {
  let lastErr;
  for (let attempt = 0; attempt < GROQ_KEYS.length; attempt++) {
    try {
      return await fn(nextGroqClient());
    } catch (e) {
      lastErr = e;
      // rate-limit or quota → try next key
      if (e?.status === 429 || e?.status === 402) continue;
      throw e;
    }
  }
  throw lastErr;
}

// ── AI label scan ─────────────────────────────────────────────────────────────
app.post("/api/scan", async (req, res) => {
  const { imageBase64 } = req.body;
  if (!imageBase64) return res.status(400).json({ ok: false, error: "No image provided" });

  const prompt = `Extract nutrition facts from this label. Read the serving size and all nutrition values carefully.

CRITICAL INSTRUCTIONS:
1. Find "Serving size" - extract the grams value (e.g., "28g" or "About 15 chips (28g)")
2. Find "Calories" or "Energy" - this is the kcal value
3. Find macros: Total Fat, Protein, Total Carbohydrate (or Carbs)
4. Find fiber and sugar if listed
5. Convert ALL values to per 100g basis using: (value / serving_grams) * 100
6. Return ONLY the JSON below, no extra text:

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
    "label": "exact serving size text",
    "grams": serving_size_in_grams
  }
}`;

  try {
    const result = await groqWithFallback(async (groq) => {
      const chat = await groq.chat.completions.create({
        model: "llama-3.2-90b-vision-preview",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              {
                type: "image_url",
                image_url: {
                  url: imageBase64.startsWith("data:")
                    ? imageBase64
                    : `data:image/jpeg;base64,${imageBase64}`,
                },
              },
            ],
          },
        ],
        max_tokens: 1024,
        temperature: 0,
      });
      return chat.choices[0]?.message?.content || "";
    });

    console.log("Raw AI response:", result);

    // strip markdown fences and extract JSON
    let clean = result.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    
    // Try to find JSON in response if wrapped in text
    const jsonMatch = clean.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      clean = jsonMatch[0];
    }

    const parsed = JSON.parse(clean);
    
    // Validate required fields
    if (!parsed.per100 || typeof parsed.per100.k !== 'number') {
      throw new Error("Invalid response format");
    }

    console.log("Parsed data:", JSON.stringify(parsed, null, 2));
    res.json({ ok: true, data: parsed });
  } catch (e) {
    console.error("Scan error:", e.message);
    console.error("Stack:", e.stack);
    res.json({ 
      ok: false, 
      error: "AI couldn't read the label clearly",
      debug: e.message 
    });
  }
});

// ── Sync endpoints ────────────────────────────────────────────────────────────
// Save full state snapshot for a user
app.post("/api/sync", async (req, res) => {
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

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`SuyuFit backend running on ${PORT}`));
