import { createFileRoute } from "@tanstack/react-router";
import DocumentAccessLogs from "@/pages/admin/DocumentAccessLogs";

export const Route = createFileRoute("/admin/document-logs")({
  component: DocumentAccessLogs,
});
