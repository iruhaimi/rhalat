import { createFileRoute } from "@tanstack/react-router";
import UnlockRequestsManagement from "@/pages/admin/UnlockRequestsManagement";

export const Route = createFileRoute("/admin/unlock-requests")({
  component: UnlockRequestsManagement,
});
