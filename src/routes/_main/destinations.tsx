import { createFileRoute } from "@tanstack/react-router";
import Destinations from "@/pages/Destinations";

export const Route = createFileRoute("/_main/destinations")({
  component: Destinations,
});
