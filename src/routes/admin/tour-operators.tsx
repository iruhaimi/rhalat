import { createFileRoute } from "@tanstack/react-router";
import TourOperatorsApproval from "@/pages/admin/TourOperatorsApproval";

export const Route = createFileRoute("/admin/tour-operators")({
  component: TourOperatorsApproval,
});
