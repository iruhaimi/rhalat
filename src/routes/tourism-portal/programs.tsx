import { createFileRoute } from "@tanstack/react-router";
import TourOperatorMyPrograms from "@/pages/tourism-portal/MyPrograms";

export const Route = createFileRoute("/tourism-portal/programs")({
  component: TourOperatorMyPrograms,
});
