import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseAnon } from "../supabase";

export default defineTool({
  name: "list_visa_types",
  title: "List visa types and pricing",
  description:
    "List active visa types for a destination country, including price, processing days, validity and government fees.",
  inputSchema: {
    country_code: z.string().trim().min(2).max(4).describe("ISO country code, e.g. FR, IT, GB."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ country_code }) => {
    const supabase = supabaseAnon();
    const { data: country, error: countryError } = await supabase
      .from("countries")
      .select("id, name, code")
      .ilike("code", country_code)
      .eq("is_active", true)
      .maybeSingle();
    if (countryError) return { content: [{ type: "text", text: countryError.message }], isError: true };
    if (!country)
      return { content: [{ type: "text", text: `No active country found for code "${country_code}".` }], isError: true };

    const { data, error } = await supabase
      .from("visa_types")
      .select(
        "id, name, description, price, child_price, infant_price, government_fees, processing_days, validity_days, max_stay_days, entry_type",
      )
      .eq("country_id", country.id)
      .eq("is_active", true)
      .order("display_order", { ascending: true });
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    const payload = { country, visa_types: data ?? [] };
    return { content: [{ type: "text", text: JSON.stringify(payload) }], structuredContent: payload };
  },
});