// Claude fallback for words the dictionary doesn't have.
// Switched off unless ANTHROPIC_API_KEY is set in Vercel's environment variables.
// The key only ever lives on the server; the page never sees it.
import Anthropic from "@anthropic-ai/sdk";

const MODEL = "claude-opus-5-5";
const WORD = /^[\p{L}\p{M}][\p{L}\p{M}' .-]{0,39}$/u;

// Light per-instance limit so a public link can't run up the bill.
const hits = new Map();
function limited(ip) {
  const now = Date.now(), win = 60_000, max = 10;
  const list = (hits.get(ip) || []).filter(t => now - t < win);
  list.push(now); hits.set(ip, list);
  if (hits.size > 5000) hits.clear();
  return list.length > max;
}

function prompt(word) {
  return [
    `You are a thesaurus for a New Zealand creative studio. Map the word or phrase "${word}".`,
    `Group related words by distinct meaning (sense). Use New Zealand English spelling.`,
    `- 2 to 6 senses, most common first.`,
    `- Each sense: part of speech (noun, verb, adjective or adverb), a plain gloss under 90 characters, and 3 to 7 synonyms or close words. Lowercase unless a proper noun. Never repeat the headword.`,
    `- "opposites": 0 to 5 true antonyms (empty if none).`,
    `Reply with only JSON of this shape:`,
    `{"word":"sand","senses":[{"pos":"noun","gloss":"Loose grains of worn rock found on beaches.","words":["grit","silt","shingle"]}],"opposites":[]}`
  ].join("\n");
}

export default async function handler(req, res) {
  const enabled = !!process.env.ANTHROPIC_API_KEY;
  res.setHeader("cache-control", "no-store");

  if (req.method === "GET") return res.status(200).json({ enabled });
  if (req.method !== "POST") return res.status(405).json({ error: "upstream_error" });
  if (!enabled) return res.status(503).json({ error: "off" });

  const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "anon";
  if (limited(ip)) return res.status(429).json({ error: "rate_limited" });

  const word = String((req.body && req.body.word) || "").trim().replace(/\s+/g, " ");
  if (!WORD.test(word)) return res.status(400).json({ error: "refused" });

  const client = new Anthropic();
  try {
    const msg = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 2000,
      output_config: { effort: "low" },
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      messages: [{ role: "user", content: prompt(word) }]
    });
    if (msg.stop_reason === "refusal") return res.status(200).json({ error: "refused" });
    const text = msg.content.filter(b => b.type === "text").map(b => b.text).join("");
    const json = text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1);
    let data;
    try { data = JSON.parse(json); } catch { return res.status(200).json({ error: "invalid_json" }); }
    return res.status(200).json(data);
  } catch (e) {
    if (e instanceof Anthropic.RateLimitError) return res.status(429).json({ error: "rate_limited" });
    console.error("claude fallback failed:", e && e.status, e && e.message);
    return res.status(502).json({ error: "upstream_error" });
  }
}
