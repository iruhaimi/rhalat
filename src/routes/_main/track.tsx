import { createFileRoute } from "@tanstack/react-router";
import TrackApplication from "@/pages/TrackApplication";

export const Route = createFileRoute("/_main/track")({
  component: TrackApplication,
});
