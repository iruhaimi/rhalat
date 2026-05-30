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

// Allow-list: only these tool names are EVER executed. Anything else from the model is ignored.
const ALLOWED_TOOLS = new Set<string>([
  ...Object.keys(TOOL_NAME_MAP),
  "lookup_visa",
  "lookup_offer",
]);

// Server-side argument validators (defense in depth on top of RPC checks)
function validateArgs(name: string, args: any): { ok: true; data: any } | { ok: false; error: string } {
  if (args === null || typeof args !== "object") return { ok: false, error: "arguments_not_object" };
  const isUuid = (v: any) => typeof v === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
  switch (name) {
    case "ai_update_visa_price":
      if (!isUuid(args.visa_id)) return { ok: false, error: "invalid_visa_id" };
      if (typeof args.new_price !== "number" || args.new_price <= 0 || args.new_price > 100000) return { ok: false, error: "invalid_price" };
      return { ok: true, data: { visa_id: args.visa_id, new_price: args.new_price } };
    case "ai_toggle_offer":
      if (!isUuid(args.offer_id)) return { ok: false, error: "invalid_offer_id" };
      if (typeof args.active !== "boolean") return { ok: false, error: "invalid_active" };
      return { ok: true, data: { offer_id: args.offer_id, active: args.active } };
    case "ai_query_applications": {
      const out: any = {};
      if (args.status !== undefined) {
        if (typeof args.status !== "string" || args.status.length > 40) return { ok: false, error: "invalid_status" };
        out.status = args.status;
      }
      out.days_back = Math.min(Math.max(parseInt(args.days_back ?? 30, 10) || 30, 1), 365);
      out.limit = Math.min(Math.max(parseInt(args.limit ?? 20, 10) || 20, 1), 100);
      return { ok: true, data: out };
    }
    case "ai_agent_performance":
      return { ok: true, data: { days_back: Math.min(Math.max(parseInt(args.days_back ?? 30, 10) || 30, 1), 365) } };
    case "ai_bulk_notify":
      if (typeof args.title !== "string" || args.title.trim().length < 3 || args.title.length > 200) return { ok: false, error: "invalid_title" };
      if (typeof args.message !== "string" || args.message.trim().length < 5 || args.message.length > 1000) return { ok: false, error: "invalid_message" };
      return {
        ok: true,
        data: {
          status_filter: typeof args.status_filter === "string" ? args.status_filter : null,
          title: args.title.trim(),
          message: args.message.trim(),
          max_recipients: Math.min(Math.max(parseInt(args.max_recipients ?? 200, 10) || 200, 1), 500),
        },
      };
    case "ai_update_site_content":
      if (typeof args.page !== "string" || typeof args.section !== "string") return { ok: false, error: "invalid_page_section" };
      if (!args.content || typeof args.content !== "object") return { ok: false, error: "invalid_content" };
      return { ok: true, data: { page: args.page, section: args.section, content: args.content } };
    case "lookup_visa":
    case "lookup_offer":
      if (typeof args.query !== "string" || args.query.length < 1 || args.query.length > 100) return { ok: false, error: "invalid_query" };
      // Strip wildcards used in ilike to prevent SQL pattern injection abuse
      return { ok: true, data: { query: args.query.replace(/[%_\\]/g, "") } };
    default:
      return { ok: false, error: "unknown_tool" };
  }
}

function sanitizeMessage(msg: string): string {
  // Strip control chars (except \n, \t)
  return msg.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "").trim();
}

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
    const cleanMessage = sanitizeMessage(message);
    if (cleanMessage.length === 0) {
      return new Response(JSON.stringify({ error: "empty_message" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Rate limit: max 30 messages in last 60 seconds for this user
    const { count: recentCount } = await admin
      .from("ai_assistant_messages")
      .select("id", { count: "exact", head: true })
      .eq("role", "user")
      .in("conversation_id",
        (await admin.from("ai_assistant_conversations").select("id").eq("user_id", userData.user.id)).data?.map((c: any) => c.id) ?? ["00000000-0000-0000-0000-000000000000"]
      )
      .gte("created_at", new Date(Date.now() - 60_000).toISOString());
    if ((recentCount ?? 0) >= 30) {
      return new Response(JSON.stringify({ error: "rate_limited" }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get or create conversation
    let convId = conversation_id as string | null;
    if (!convId) {
      const { data, error } = await admin
        .from("ai_assistant_conversations")
        .insert({ user_id: userData.user.id, title: cleanMessage.slice(0, 60) })
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
    aiMessages.push({ role: "user", content: cleanMessage });

    // Save user message
    await admin.from("ai_assistant_messages").insert({
      conversation_id: convId, role: "user", content: cleanMessage,
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

          const toolName = tc.function.name;
          let result: any;
          let success = true;
          let errText: string | null = null;
          const t0 = Date.now();

          if (!ALLOWED_TOOLS.has(toolName)) {
            result = { error: "tool_not_allowed" };
            success = false;
            errText = "tool_not_allowed";
          } else {
            const validated = validateArgs(toolName, args);
            if (!validated.ok) {
              result = { error: "invalid_arguments", detail: validated.error };
              success = false;
              errText = validated.error;
            } else {
              try {
                result = await executeTool(toolName, validated.data, userJwt);
                if (result && typeof result === "object" && "error" in result) {
                  success = false;
                  errText = String((result as any).error);
                }
              } catch (e) {
                success = false;
                errText = e instanceof Error ? e.message : "unknown";
                result = { error: errText };
              }
            }
          }
          const duration_ms = Date.now() - t0;

          // Persist tool invocation audit
          await admin.from("ai_tool_invocations").insert({
            user_id: userData.user.id,
            conversation_id: convId,
            tool_name: toolName,
            arguments: args,
            result,
            success,
            error: errText,
            duration_ms,
          });

          aiMessages.push({
            role: "tool",
            tool_call_id: tc.id,
            name: toolName,
            content: JSON.stringify(result),
          });
          await admin.from("ai_assistant_messages").insert({
            conversation_id: convId,
            role: "tool",
            tool_name: toolName,
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