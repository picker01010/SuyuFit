require("dotenv").config();
const express = require("express");
const cors = require("cors");
const Groq = require("groq-sdk");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const OpenAI = require("openai");
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

// ── AI label scan - SIMPLIFIED AND WORKING ─────────────────────────────────
app.post("/api/scan", async (req, res) => {
  const { imageBase64 } = req.body;
  if (!imageBase64) return res.status(400).json({ ok: false, error: "No image provided" });

  const prompt = `You are a nutrition label reader. Extract ALL nutrition facts from this image.

Look for:
- Product name
- Serving size in grams
- Calories (kcal)
- Protein, Carbs, Fat in grams
- Fiber, Sugar, Sodium if shown

Convert everything to per 100g values.

Respond with ONLY this JSON, nothing else:
{
  "name": "product name",
  "per100": {
    "k": 500,
    "p": 20,
    "c": 60,
    "f": 15,
    "fi": 5,
    "su": 10,
    "na": 300
  },
  "serving": {
    "label": "1 serving (30g)",
    "grams": 30
  }
}`;

  const imageUrl = imageBase64.startsWith("data:") ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`;
  const errors = [];

  // Try OpenAI first (best for vision)
  if (process.env.OPENAI_KEY) {
    try {
      console.log("→ Trying OpenAI...");
      const openai = new OpenAI({ apiKey: process.env.OPENAI_KEY });
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: imageUrl } }
          ]
        }],
        max_tokens: 1024,
        temperature: 0
      });
      
      const text = response.choices[0]?.message?.content || "";
      console.log("OpenAI response:", text.substring(0, 200));
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        if (parsed.per100?.k) {
          console.log("✓ OpenAI SUCCESS");
          return res.json({ ok: true, data: parsed, ai: "openai" });
        }
      }
    } catch (e) {
      errors.push(`OpenAI: ${e.message}`);
      console.log("✗ OpenAI failed:", e.message);
    }
  }

  // Try Groq (text-only, skip vision)
  console.log("Groq vision models decommissioned, skipping");

  // Try Gemini (has free tier with vision)
  if (process.env.GEMINI_KEY) {
    try {
      console.log("→ Trying Gemini...");
      const { GoogleGenerativeAI } = require("@google/generative-ai");
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent([
        prompt,
        { inlineData: { data: imageUrl.split(",")[1] || imageUrl, mimeType: "image/jpeg" } }
      ]);
      
      const text = result.response.text();
      console.log("Gemini response:", text.substring(0, 200));
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        if (parsed.per100?.k) {
          console.log("✓ Gemini SUCCESS");
          return res.json({ ok: true, data: parsed, ai: "gemini" });
        }
      }
    } catch (e) {
      errors.push(`Gemini: ${e.message}`);
      console.log("✗ Gemini failed:", e.message);
    }
  }

  console.error("ALL PROVIDERS FAILED:", errors);
  res.json({ 
    ok: false, 
    error: "Could not read label. Check photo quality and lighting.",
    debug: errors.join(" | ")
  });
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
