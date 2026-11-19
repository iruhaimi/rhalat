import { createFileRoute } from "@tanstack/react-router";
import PortalSecurity from "@/pages/admin/PortalSecurity";

export const Route = createFileRoute("/admin/portal-security")({
  component: PortalSecurity,
});
