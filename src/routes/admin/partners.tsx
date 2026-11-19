import { createFileRoute } from "@tanstack/react-router";
import PartnersManagement from "@/pages/admin/PartnersManagement";

export const Route = createFileRoute("/admin/partners")({
  component: PartnersManagement,
});
