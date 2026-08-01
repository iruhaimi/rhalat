import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listCountriesTool from "./tools/list-countries";
import listVisaTypesTool from "./tools/list-visa-types";
import listMyApplicationsTool from "./tools/list-my-applications";
import getApplicationStatusTool from "./tools/get-application-status";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "visa-faster",
  title: "visa-faster",
  version: "0.1.0",
  instructions:
    "Tools for the visa-faster travel visa service. Use `list_countries` and `list_visa_types` to explore destinations, pricing and processing times. Use `list_my_applications` and `get_application_status` to read the signed-in user's own visa applications. This service is not a government body; always point users to official embassy sources for legal requirements.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listCountriesTool, listVisaTypesTool, listMyApplicationsTool, getApplicationStatusTool],
});