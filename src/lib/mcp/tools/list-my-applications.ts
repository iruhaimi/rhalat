import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_my_applications",
  title: "List my visa applications",
  description:
    "List the signed-in user's own visa applications with reference number, status, travel date and destination.",
  inputSchema: {
    status: z.string().trim().optional().describe("Optional status filter, e.g. draft, submitted, approved."),
    limit: z.number().int().min(1).max(50).optional().describe("Maximum applications to return (default 20)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ status, limit }, ctx) => {
    if (!ctx.isAuthenticated())
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    let query = supabaseForUser(ctx)
      .from("applications")
      .select(
        "id, display_number, status, travel_date, return_date, purpose_of_travel, submitted_at, created_at, visa_types(name, countries(name, code))",
      )
      .eq("user_id", ctx.getUserId()!)
      .order("created_at", { ascending: false })
      .limit(limit ?? 20);
    if (status) query = query.eq("status", status as never);
    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { applications: data ?? [] },
    };
  },
});