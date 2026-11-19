import { createFileRoute } from "@tanstack/react-router";
import TourOperatorDashboard from "@/pages/tourism-portal/Dashboard";

export const Route = createFileRoute("/tourism-portal/")({
  component: TourOperatorDashboard,
});
