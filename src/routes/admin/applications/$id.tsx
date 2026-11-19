import { createFileRoute } from "@tanstack/react-router";
import ApplicationDetail from "@/pages/admin/ApplicationDetail";

export const Route = createFileRoute("/admin/applications/$id")({
  component: ApplicationDetail,
});
