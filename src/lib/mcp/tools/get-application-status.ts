import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "get_application_status",
  title: "Get one of my applications",
  description:
    "Get full status details for one of the signed-in user's visa applications by its reference number (e.g. VF-2026-0001) or id.",
  inputSchema: {
    reference: z.string().trim().min(3).describe("Application reference number (display number) or application id."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ reference }, ctx) => {
    if (!ctx.isAuthenticated())
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const supabase = supabaseForUser(ctx);
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(reference);
    const { data, error } = await supabase
      .from("applications")
      .select(
        "id, display_number, status, travel_date, return_date, purpose_of_travel, accommodation_details, submitted_at, approved_at, rejection_reason, created_at, updated_at, visa_types(name, price, processing_days, countries(name, code))",
      )
      .eq("user_id", ctx.getUserId()!)
      .eq(isUuid ? "id" : "display_number", reference)
      .maybeSingle();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!data)
      return { content: [{ type: "text", text: `No application found for "${reference}".` }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data) }],
      structuredContent: { application: data },
    };
  },
});