import { createFileRoute } from "@tanstack/react-router";
import EmailLogsManagement from "@/pages/admin/EmailLogsManagement";

export const Route = createFileRoute("/admin/email-logs")({
  component: EmailLogsManagement,
});
