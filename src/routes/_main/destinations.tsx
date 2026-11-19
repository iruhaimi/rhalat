import { createFileRoute } from "@tanstack/react-router";
import { pageHead } from "@/lib/routeHead";
import Destinations from "@/pages/Destinations";

export const Route = createFileRoute("/_main/destinations")({
  head: () =>
    pageHead({
      title: "الوجهات والدول — عطلات رحلاتكم",
      description: "تصفح جميع الدول وأنواع التأشيرات المتاحة مع رسوم وتفاصيل التقديم لكل وجهة.",
      path: "/destinations",
    }),
  component: Destinations,
});
