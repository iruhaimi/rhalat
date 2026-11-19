import { createFileRoute } from "@tanstack/react-router";
import GTagCheck from "@/pages/GTagCheck";

export const Route = createFileRoute("/__gtag-check")({
  component: GTagCheck,
});
