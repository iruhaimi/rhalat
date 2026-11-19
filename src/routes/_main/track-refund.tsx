import { createFileRoute } from "@tanstack/react-router";
import { pageHead } from "@/lib/routeHead";
import TrackRefund from "@/pages/TrackRefund";

export const Route = createFileRoute("/_main/track-refund")({
  head: () =>
    pageHead({
      title: "تتبع طلب الاسترداد — عطلات رحلاتكم",
      description: "تابع حالة طلب الاسترداد الخاص بك في أي وقت.",
      path: "/track-refund",
    }),
  component: TrackRefund,
});
