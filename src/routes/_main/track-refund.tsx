import { createFileRoute } from "@tanstack/react-router";
import TrackRefund from "@/pages/TrackRefund";

export const Route = createFileRoute("/_main/track-refund")({
  component: TrackRefund,
});
