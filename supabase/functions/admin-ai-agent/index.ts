import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

const SYSTEM_PROMPT = `أنت مساعد ذكي يدير موقع تأشيرات "عطلات رحلاتكم" نيابة عن المالك.

قواعد صارمة:
- رد دائماً بالعربية الفصحى المختصرة.
- قبل تنفيذ أي عملية كتابة (تغيير سعر، تفعيل عرض، إرسال إشعار جماعي، تعديل محتوى) اعرض ملخص العملية واطلب تأكيد المالك بقولك "هل تريد التنفيذ؟" — لا تستدعِ الأداة قبل أن يرد بـ "نعم" أو "أكد" أو ما يماثلها.
- لعمليات القراءة (استعلام طلبات، تقارير الوكلاء) نفذ مباشرة دون تأكيد.
- إذا فشلت أداة بسبب access_denied اشرح للمستخدم أنه لا يملك الصلاحية.
- لا تخترع بيانات. إذا لم تجد التأشيرة/العرض المطلوب، اعتذر واطلب توضيحاً.
- اعرض النتائج بشكل منسق وقابل للقراءة.`;

const TOOLS = [
  {
    type: "function",
    function: {
      name: "ai_update_visa_price",
      description: "تغيير سعر تأشيرة محددة. يتطلب تأكيد المالك أولاً.",
      parameters: {
        type: "object",
        properties: {
          visa_id: { type: "string", description: "معرف UUID للتأشيرة" },
          new_price: { type: "number", description: "السعر الجديد بالريال" },
        },
        required: ["visa_id", "new_price"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "ai_toggle_offer",
      description: "تفعيل أو إيقاف عرض خاص.",
      parameters: {
        type: "object",
        properties: {
          offer_id: { type: "string" },
          active: { type: "boolean" },
        },
        required: ["offer_id", "active"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "ai_query_applications",
      description: "استعلام عن طلبات التأشيرة. (قراءة فقط، نفذ مباشرة)",
      parameters: {
        type: "object",
        properties: {
          status: {
            type: "string",
            enum: ["draft", "pending_payment", "submitted", "under_review", "documents_required", "processing", "approved", "rejected", "cancelled", "whatsapp_pending"],
          },
          days_back: { type: "integer", default: 30 },
          limit: { type: "integer", default: 20 },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "ai_agent_performance",
      description: "تقرير أداء الوكلاء خلال فترة محددة. (قراءة فقط)",
      parameters: {
        type: "object",
        properties: { days_back: { type: "integer", default: 30 } },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "ai_bulk_notify",
      description: "إرسال إشعار جماعي للعملاء حسب فلتر الحالة. يتطلب تأكيد قبل التنفيذ.",
      parameters: {
        type: "object",
        properties: {
          status_filter: { type: "string", description: "فلتر بحالة الطلب (اختياري)" },
          title: { type: "string", minLength: 3 },
          message: { type: "string", minLength: 5 },
          max_recipients: { type: "integer", default: 200, maximum: 500 },
        },
        required: ["title", "message"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "ai_update_site_content",
      description: "تحديث نص/محتوى في الموقع. يتطلب تأكيد.",
      parameters: {
        type: "object",
        properties: {
          page: { type: "string" },
          section: { type: "string" },
          content: { type: "object", description: "JSON كائن المحتوى" },
        },
        required: ["page", "section", "content"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "lookup_visa",
      description: "بحث عن تأشيرة بالاسم/الدولة لمعرفة UUID قبل تعديل السعر.",
      parameters: {
        type: "object",
        properties: { query: { type: "string" } },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "lookup_offer",
      description: "بحث عن عرض بالاسم لمعرفة UUID.",
      parameters: {
        type: "object",
        properties: { query: { type: "string" } },
        required: ["query"],
      },
    },
  },
];

const TOOL_NAME_MAP: Record<string, string> = {
  ai_update_visa_price: "ai_update_visa_price",
  ai_toggle_offer: "ai_toggle_offer",
  ai_query_applications: "ai_query_applications",
  ai_agent_performance: "ai_agent_performance",
  ai_bulk_notify: "ai_bulk_notify",
  ai_update_site_content: "ai_update_site_content",
};

async function executeTool(name: string, args: any, userJwt: string) {
  // Use a user-scoped client so the RPC sees auth.uid() and enforces has_permission.
  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${userJwt}` } },
  });

  if (name === "lookup_visa") {
    const { data, error } = await userClient
      .from("visa_types")
      .select("id, name, price, country_id, countries!inner(name)")
      .or(`name.ilike.%${args.query}%,countries.name.ilike.%${args.query}%`)
      .limit(10);
    if (error) return { error: error.message };
    return { rows: data };
  }

  if (name === "lookup_offer") {
    const { data, error } = await userClient
      .from("special_offers")
      .select("id, title, country_name, is_active, sale_price")
      .ilike("title", `%${args.query}%`)
      .limit(10);
    if (error) return { error: error.message };
    return { rows: data };
  }

  const rpcName = TOOL_NAME_MAP[name];
  if (!rpcName) return { error: "unknown_tool" };

  const params: Record<string, any> = {};
  for (const [k, v] of Object.entries(args)) params["p_" + k] = v;

  const { data, error } = await userClient.rpc(rpcName, params);
  if (error) return { error: error.message };
  return data;
}

async function callAI(messages: any[]) {
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages,
      tools: TOOLS,
      tool_choice: "auto",
    }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`ai_gateway_${res.status}: ${txt.slice(0, 200)}`);
  }
  return await res.json();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "missing_auth" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userJwt = authHeader.replace("Bearer ", "");

    // Validate the caller is a super admin
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "invalid_session" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: isOwner } = await admin.rpc("is_super_admin", { _user_id: userData.user.id });
    if (!isOwner) {
      return new Response(JSON.stringify({ error: "owner_only" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { conversation_id, message } = await req.json();
    if (!message || typeof message !== "string" || message.length > 4000) {
      return new Response(JSON.stringify({ error: "invalid_message" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get or create conversation
    let convId = conversation_id as string | null;
    if (!convId) {
      const { data, error } = await admin
        .from("ai_assistant_conversations")
        .insert({ user_id: userData.user.id, title: message.slice(0, 60) })
        .select("id")
        .single();
      if (error) throw error;
      convId = data.id;
    }

    // Load conversation history
    const { data: history } = await admin
      .from("ai_assistant_messages")
      .select("role, content, tool_calls, tool_name, tool_result")
      .eq("conversation_id", convId)
      .order("created_at", { ascending: true })
      .limit(40);

    const aiMessages: any[] = [{ role: "system", content: SYSTEM_PROMPT }];
    for (const m of history ?? []) {
      if (m.role === "user" || m.role === "assistant") {
        const msg: any = { role: m.role, content: m.content ?? "" };
        if (m.role === "assistant" && m.tool_calls) msg.tool_calls = m.tool_calls;
        aiMessages.push(msg);
      } else if (m.role === "tool") {
        aiMessages.push({
          role: "tool",
          tool_call_id: (m.tool_calls as any)?.[0]?.id ?? "call_unknown",
          name: m.tool_name,
          content: JSON.stringify(m.tool_result ?? {}),
        });
      }
    }
    aiMessages.push({ role: "user", content: message });

    // Save user message
    await admin.from("ai_assistant_messages").insert({
      conversation_id: convId, role: "user", content: message,
    });

    // Tool-calling loop (max 4 iterations)
    let finalText = "";
    for (let iter = 0; iter < 4; iter++) {
      const completion = await callAI(aiMessages);
      const choice = completion.choices?.[0];
      const assistantMsg = choice?.message;
      if (!assistantMsg) break;

      if (assistantMsg.tool_calls && assistantMsg.tool_calls.length > 0) {
        aiMessages.push(assistantMsg);
        await admin.from("ai_assistant_messages").insert({
          conversation_id: convId,
          role: "assistant",
          content: assistantMsg.content ?? "",
          tool_calls: assistantMsg.tool_calls,
        });

        for (const tc of assistantMsg.tool_calls) {
          let args = {};
          try { args = JSON.parse(tc.function.arguments || "{}"); } catch (_) {}
          const result = await executeTool(tc.function.name, args, userJwt);
          aiMessages.push({
            role: "tool",
            tool_call_id: tc.id,
            name: tc.function.name,
            content: JSON.stringify(result),
          });
          await admin.from("ai_assistant_messages").insert({
            conversation_id: convId,
            role: "tool",
            tool_name: tc.function.name,
            tool_calls: [{ id: tc.id }],
            tool_result: result,
          });
        }
        continue;
      }

      finalText = assistantMsg.content ?? "";
      await admin.from("ai_assistant_messages").insert({
        conversation_id: convId, role: "assistant", content: finalText,
      });
      break;
    }

    await admin.from("ai_assistant_conversations").update({ updated_at: new Date().toISOString() }).eq("id", convId);

    return new Response(JSON.stringify({ conversation_id: convId, reply: finalText }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("admin-ai-agent error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});