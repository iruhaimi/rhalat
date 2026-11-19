import { createFileRoute } from "@tanstack/react-router";
import AIAssistant from "@/pages/admin/AIAssistant";

export const Route = createFileRoute("/admin/ai-assistant/")({
  component: AIAssistant,
});
