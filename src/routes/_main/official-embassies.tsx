import { createFileRoute } from "@tanstack/react-router";
import OfficialEmbassies from "@/pages/OfficialEmbassies";

export const Route = createFileRoute("/_main/official-embassies")({
  component: OfficialEmbassies,
});
