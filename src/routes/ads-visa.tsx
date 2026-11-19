import { createFileRoute } from "@tanstack/react-router";
import LandingVisa from "@/pages/LandingVisa";

export const Route = createFileRoute("/ads-visa")({
  component: LandingVisa,
});
