import { createFileRoute } from "@tanstack/react-router";
import PaymentFailed from "@/pages/PaymentFailed";

export const Route = createFileRoute("/_main/payment-failed")({
  component: PaymentFailed,
});
