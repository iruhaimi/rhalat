import { createFileRoute } from "@tanstack/react-router";
import OffersManagement from "@/pages/admin/OffersManagement";

export const Route = createFileRoute("/admin/offers")({
  component: OffersManagement,
});
