import { createFileRoute } from "@tanstack/react-router";
import Apply from "@/pages/Apply";

export const Route = createFileRoute("/_main/apply/$countryCode")({
  component: Apply,
});
