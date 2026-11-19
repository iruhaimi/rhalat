import { createFileRoute } from "@tanstack/react-router";
import { pageHead } from "@/lib/routeHead";
import TrackApplication from "@/pages/TrackApplication";

export const Route = createFileRoute("/_main/track")({
  head: () =>
    pageHead({
      title: "تتبع طلب التأشيرة — عطلات رحلاتكم",
      description: "تتبع حالة طلب تأشيرتك خطوة بخطوة باستخدام رقم الطلب.",
      path: "/track",
    }),
  component: TrackApplication,
});
