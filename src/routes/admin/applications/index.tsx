import { createFileRoute } from "@tanstack/react-router";
import ApplicationsList from "@/pages/admin/ApplicationsList";

export const Route = createFileRoute("/admin/applications/")({
  component: ApplicationsList,
});
