import { createFileRoute } from "@tanstack/react-router";
import Refund from "@/pages/Refund";

export const Route = createFileRoute("/_main/refund")({
  component: Refund,
});
