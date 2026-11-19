import { createFileRoute } from "@tanstack/react-router";
import StaffAuditLog from "@/pages/admin/StaffAuditLog";

export const Route = createFileRoute("/admin/audit-log")({
  component: StaffAuditLog,
});
