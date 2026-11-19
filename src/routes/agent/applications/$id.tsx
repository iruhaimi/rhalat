import { createFileRoute } from "@tanstack/react-router";
import AgentApplicationDetail from "@/pages/agent/AgentApplicationDetail";

export const Route = createFileRoute("/agent/applications/$id")({
  component: AgentApplicationDetail,
});
