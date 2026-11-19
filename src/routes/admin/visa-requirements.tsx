import { createFileRoute } from "@tanstack/react-router";
import VisaRequirementsManagement from "@/pages/admin/VisaRequirementsManagement";

export const Route = createFileRoute("/admin/visa-requirements")({
  component: VisaRequirementsManagement,
});
