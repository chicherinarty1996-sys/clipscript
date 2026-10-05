export default async function handler(req, res) {
  const allowedOrigins = [
    "https://chicherinarty1996-sys.github.io",
    "https://clipscript-two.vercel.app",
    "https://clipscript-mes30wv9c-forkins.vercel.app"
  ];

  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Vary", "Origin");

  if (req.method === "OPTIONS") return res.status(204).end();

  if (req.method !== "POST") return res.status(405).json({ error: "Use POST" });

  const prompt = typeof req.body?.prompt === "string" ? req.body.prompt.trim() : "";

  if (prompt.length < 20) return res.status(400).json({ error: "Prompt is too short" });
  if (prompt.length > 30000) return res.status(413).json({ error: "Text is too long (max 30000 characters)" });

  if (!process.env.GROQ_API_KEY) {
    return res.status(500).json({ error: "GROQ_API_KEY is not configured in Vercel" });
  }

  try {
    const upstream = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-20b",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.75,
        max_completion_tokens: 4096
      })
    });

    const data = await upstream.json();

    if (!upstream.ok) {
      return res.status(upstream.status).json({
        error: data?.error?.message || "Groq request failed"
      });
    }

    const text = data?.choices?.[0]?.message?.content || "";
    if (!text) {
      return res.status(502).json({ error: "AI returned an empty response" });
    }

    return res.status(200).json({ text });
  } catch (error) {
    return res.status(500).json({ error: "AI request failed" });
  }
}
