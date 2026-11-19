import { createFileRoute } from "@tanstack/react-router";
import AgentDashboard from "@/pages/agent/AgentDashboard";

export const Route = createFileRoute("/agent/")({
  component: AgentDashboard,
});
