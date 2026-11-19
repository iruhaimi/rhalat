import { createFileRoute } from "@tanstack/react-router";
import RefundRequestsManagement from "@/pages/admin/RefundRequestsManagement";

export const Route = createFileRoute("/admin/refunds")({
  component: RefundRequestsManagement,
});
