import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseAnon } from "../supabase";

export default defineTool({
  name: "list_countries",
  title: "List destination countries",
  description:
    "List active visa destination countries offered by the service, with country code and whether it is a Schengen state.",
  inputSchema: {
    search: z.string().trim().optional().describe("Optional case-insensitive filter on the country name."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ search }) => {
    let query = supabaseAnon()
      .from("countries")
      .select("id, name, code, is_schengen, seo_description, display_order")
      .eq("is_active", true)
      .order("display_order", { ascending: true })
      .limit(200);
    if (search) query = query.ilike("name", `%${search}%`);
    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { countries: data ?? [] },
    };
  },
});