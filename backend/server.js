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

// ── AI label scan with Gemini → ChatGPT → Groq fallback ─────────────────────
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

  const imageUrl = imageBase64.startsWith("data:")
    ? imageBase64
    : `data:image/jpeg;base64,${imageBase64}`;

  let lastError;

  // 1. Try Gemini first
  if (process.env.GEMINI_KEY) {
    try {
      console.log("Trying Gemini...");
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      const imageParts = [{
        inlineData: {
          data: imageUrl.split(",")[1] || imageUrl,
          mimeType: "image/jpeg",
        },
      }];
      
      const result = await model.generateContent([prompt, ...imageParts]);
      const text = result.response.text();
      console.log("Gemini raw response:", text);
      
      let clean = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const jsonMatch = clean.match(/\{[\s\S]*\}/);
      if (jsonMatch) clean = jsonMatch[0];
      
      const parsed = JSON.parse(clean);
      if (parsed.per100 && typeof parsed.per100.k === 'number') {
        console.log("✓ Gemini success");
        return res.json({ ok: true, data: parsed, ai: "gemini" });
      }
      throw new Error("Invalid Gemini response format");
    } catch (e) {
      lastError = e;
      console.log("Gemini failed:", e.message);
      if (e.message?.includes("API_KEY")) {
        console.log("Gemini API key invalid, skipping to next provider");
      }
    }
  } else {
    console.log("No Gemini key found, skipping");
  }

  // 2. Try ChatGPT (OpenAI)
  if (process.env.OPENAI_KEY) {
    try {
      console.log("Trying ChatGPT...");
      const openai = new OpenAI({ apiKey: process.env.OPENAI_KEY });
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              {
                type: "image_url",
                image_url: { url: imageUrl },
              },
            ],
          },
        ],
        max_tokens: 1024,
        temperature: 0,
      });
      
      const text = response.choices[0]?.message?.content || "";
      console.log("ChatGPT raw response:", text);
      
      let clean = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const jsonMatch = clean.match(/\{[\s\S]*\}/);
      if (jsonMatch) clean = jsonMatch[0];
      
      const parsed = JSON.parse(clean);
      if (parsed.per100 && typeof parsed.per100.k === 'number') {
        console.log("✓ ChatGPT success");
        return res.json({ ok: true, data: parsed, ai: "chatgpt" });
      }
      throw new Error("Invalid ChatGPT response format");
    } catch (e) {
      lastError = e;
      console.log("ChatGPT failed:", e.message);
      if (e.status === 401) {
        console.log("ChatGPT API key invalid, skipping to next provider");
      }
    }
  } else {
    console.log("No OpenAI key found, skipping");
  }

  // 3. Try Groq as last resort
  if (GROQ_KEYS.length > 0) {
    try {
      console.log("Trying Groq...");
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
                  image_url: { url: imageUrl },
                },
              ],
            },
          ],
          max_tokens: 1024,
          temperature: 0,
        });
        return chat.choices[0]?.message?.content || "";
      });

      console.log("Groq raw response:", result);
      
      let clean = result.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const jsonMatch = clean.match(/\{[\s\S]*\}/);
      if (jsonMatch) clean = jsonMatch[0];
      
      const parsed = JSON.parse(clean);
      if (parsed.per100 && typeof parsed.per100.k === 'number') {
        console.log("✓ Groq success");
        return res.json({ ok: true, data: parsed, ai: "groq" });
      }
      throw new Error("Invalid Groq response format");
    } catch (e) {
      lastError = e;
      console.log("Groq failed:", e.message);
    }
  } else {
    console.log("No Groq keys found, skipping");
  }

  // All failed
  console.error("All AI providers failed. Last error:", lastError);
  res.json({ 
    ok: false, 
    error: "AI couldn't read the label clearly - try a clearer photo",
    debug: lastError?.message || "all providers failed"
  });
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
