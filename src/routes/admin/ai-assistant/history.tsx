import { createFileRoute } from "@tanstack/react-router";
import AIAssistantHistory from "@/pages/admin/AIAssistantHistory";

export const Route = createFileRoute("/admin/ai-assistant/history")({
  component: AIAssistantHistory,
});
