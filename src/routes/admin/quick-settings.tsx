import { createFileRoute } from "@tanstack/react-router";
import QuickSettings from "@/pages/admin/QuickSettings";

export const Route = createFileRoute("/admin/quick-settings")({
  component: QuickSettings,
});
