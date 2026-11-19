import { createFileRoute } from "@tanstack/react-router";
import OwnerSettings from "@/pages/admin/OwnerSettings";

export const Route = createFileRoute("/admin/owner-settings")({
  component: OwnerSettings,
});
