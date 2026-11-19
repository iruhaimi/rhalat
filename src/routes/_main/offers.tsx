import { createFileRoute } from "@tanstack/react-router";
import { pageHead } from "@/lib/routeHead";
import SpecialOffers from "@/pages/SpecialOffers";

export const Route = createFileRoute("/_main/offers")({
  head: () =>
    pageHead({
      title: "العروض الخاصة — عطلات رحلاتكم",
      description: "أحدث العروض والخصومات على خدمات التأشيرات لفترة محدودة.",
      path: "/offers",
    }),
  component: SpecialOffers,
});
