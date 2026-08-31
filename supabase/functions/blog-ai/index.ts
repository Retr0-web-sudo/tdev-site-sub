import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Admin required" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, title, content, context } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    let systemPrompt = "";
    let userPrompt = "";

    if (action === "generate") {
      systemPrompt = `You are a professional blog writer for TDEV, a luxury fashion and lifestyle brand. Write elegant, engaging blog posts in Markdown format. Use ## for section headers. Write in a refined, editorial tone. Include an engaging introduction and conclusion. Output ONLY the blog content in Markdown — no meta commentary.`;
      userPrompt = `Write a complete blog post titled "${title}".${context ? ` Additional context: ${context}` : ""}\n\nFormat the post with clear sections using ## headers, rich descriptive paragraphs, and a compelling narrative arc.`;
    } else if (action === "rewrite") {
      systemPrompt = `You are an expert editor for TDEV, a luxury fashion brand. Rewrite the provided content to be more polished, engaging, and editorial in tone. Maintain Markdown formatting with ## section headers. Output ONLY the rewritten content — no meta commentary.`;
      userPrompt = `Rewrite and improve this blog content while keeping the same topic and key points:\n\n${content}`;
    } else if (action === "suggest_tags") {
      systemPrompt = `You are a content strategist. Given blog content, suggest 3-6 relevant tags as a JSON array of lowercase strings. Output ONLY the JSON array, nothing else.`;
      userPrompt = `Suggest tags for this blog post:\n\nTitle: ${title}\n\n${content?.slice(0, 500) || ""}`;
    } else if (action === "generate_excerpt") {
      systemPrompt = `You are a copywriter. Write a concise, compelling excerpt (1-2 sentences, max 160 chars) for the given blog post. Output ONLY the excerpt text, nothing else.`;
      userPrompt = `Write an excerpt for:\n\nTitle: ${title}\n\n${content?.slice(0, 500) || ""}`;
    } else {
      return new Response(JSON.stringify({ error: "Invalid action" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits in Settings → Workspace → Usage." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // For non-streaming actions (tags, excerpt), collect full response
    if (action === "suggest_tags" || action === "generate_excerpt") {
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let full = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split("\n")) {
          if (!line.startsWith("data: ") || line.includes("[DONE]")) continue;
          try {
            const parsed = JSON.parse(line.slice(6));
            const c = parsed.choices?.[0]?.delta?.content;
            if (c) full += c;
          } catch {}
        }
      }
      return new Response(JSON.stringify({ result: full.trim() }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Stream for generate/rewrite
    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("blog-ai error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
