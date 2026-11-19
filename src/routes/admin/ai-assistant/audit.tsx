import { createFileRoute } from "@tanstack/react-router";
import AIToolAuditLog from "@/pages/admin/AIToolAuditLog";

export const Route = createFileRoute("/admin/ai-assistant/audit")({
  component: AIToolAuditLog,
});
