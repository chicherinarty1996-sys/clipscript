export default {
  async fetch(request, env) {
    const allowedOrigin = "https://chicherinarty1996-sys.github.io";
    const origin = request.headers.get("Origin") || "";
    const cors = {
      "Access-Control-Allow-Origin": allowedOrigin,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Vary": "Origin"
    };
    if (origin && origin !== allowedOrigin) return new Response("Origin not allowed", { status: 403 });
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    if (request.method !== "POST") return Response.json({ error: "Use POST" }, { status: 405, headers: cors });
    if (!env.GROQ_API_KEY) return Response.json({ error: "GROQ_API_KEY is not configured" }, { status: 500, headers: cors });
    try {
      const body = await request.json();
      const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
      if (prompt.length < 20) return Response.json({ error: "Prompt is too short" }, { status: 400, headers: cors });
      if (prompt.length > 30000) return Response.json({ error: "Text is too long (max 30000 characters)" }, { status: 413, headers: cors });
      const upstream = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${env.GROQ_API_KEY}` },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.75,
          max_tokens: 4096
        })
      });
      const data = await upstream.json();
      if (!upstream.ok) return Response.json({ error: data?.error?.message || "Groq request failed" }, { status: upstream.status, headers: cors });
      const text = data?.choices?.[0]?.message?.content || "";
      return Response.json({ text }, { headers: { ...cors, "Cache-Control": "no-store" } });
    } catch (e) {
      return Response.json({ error: "Invalid request or upstream response" }, { status: 400, headers: cors });
    }
  }
};