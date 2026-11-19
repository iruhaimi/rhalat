import { createFileRoute } from "@tanstack/react-router";
import TourismDetail from "@/pages/TourismDetail";

export const Route = createFileRoute("/_main/tourism/$id")({
  component: TourismDetail,
});
