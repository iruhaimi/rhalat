import { createFileRoute } from "@tanstack/react-router";
import SecurityStatus from "@/pages/admin/SecurityStatus";

export const Route = createFileRoute("/admin/security-status")({
  component: SecurityStatus,
});
