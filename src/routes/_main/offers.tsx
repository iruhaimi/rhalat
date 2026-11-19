import { createFileRoute } from "@tanstack/react-router";
import SpecialOffers from "@/pages/SpecialOffers";

export const Route = createFileRoute("/_main/offers")({
  component: SpecialOffers,
});
