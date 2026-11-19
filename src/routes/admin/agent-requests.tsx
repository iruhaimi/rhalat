import { createFileRoute } from "@tanstack/react-router";
import AgentRequestsManagement from "@/pages/admin/AgentRequestsManagement";

export const Route = createFileRoute("/admin/agent-requests")({
  component: AgentRequestsManagement,
});
