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
  if (!imageBase64) return res.status(400).json({ error: "No image provided" });

  const prompt = `You are a nutrition label reader. Look at this food packaging image and extract the nutrition facts.
Return ONLY valid JSON in this exact format, no markdown, no explanation:
{
  "name": "product name",
  "per100": {
    "k": <kcal per 100g as number>,
    "p": <protein g per 100g as number>,
    "c": <carbs g per 100g as number>,
    "f": <fat g per 100g as number>,
    "fi": <fiber g per 100g or 0>,
    "su": <sugar g per 100g or 0>,
    "na": <sodium mg per 100g or 0>
  },
  "serving": {
    "label": "serving size label e.g. 1 packet",
    "grams": <serving size in grams as number>
  }
}
If values are per serving not per 100g, convert them to per 100g.
If you cannot read the label clearly, still return your best estimate with the data visible.`;

  try {
    const result = await groqWithFallback(async (groq) => {
      const chat = await groq.chat.completions.create({
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
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
        max_tokens: 512,
        temperature: 0.1,
      });
      return chat.choices[0]?.message?.content || "";
    });

    // strip markdown fences if model wraps in ```json
    const clean = result.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(clean);
    res.json({ ok: true, data: parsed });
  } catch (e) {
    console.error("scan error", e?.message);
    res.status(500).json({ error: "Could not read label — try a clearer photo" });
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
