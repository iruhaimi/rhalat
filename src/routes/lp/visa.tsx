import { createFileRoute } from "@tanstack/react-router";
import LandingVisa from "@/pages/LandingVisa";

export const Route = createFileRoute("/lp/visa")({
  component: LandingVisa,
});
