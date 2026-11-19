import { createFileRoute } from "@tanstack/react-router";
import AgentApplicationsList from "@/pages/agent/AgentApplicationsList";

export const Route = createFileRoute("/agent/applications/")({
  component: AgentApplicationsList,
});
