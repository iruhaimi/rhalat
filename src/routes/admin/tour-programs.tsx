import { createFileRoute } from "@tanstack/react-router";
import TourProgramsManagement from "@/pages/admin/TourProgramsManagement";

export const Route = createFileRoute("/admin/tour-programs")({
  component: TourProgramsManagement,
});
