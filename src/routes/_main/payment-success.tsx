import { createFileRoute } from "@tanstack/react-router";
import PaymentSuccess from "@/pages/PaymentSuccess";

export const Route = createFileRoute("/_main/payment-success")({
  component: PaymentSuccess,
});
