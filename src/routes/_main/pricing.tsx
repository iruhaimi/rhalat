import { createFileRoute } from "@tanstack/react-router";
import { pageHead } from "@/lib/routeHead";
import Pricing from "@/pages/Pricing";

export const Route = createFileRoute("/_main/pricing")({
  head: () =>
    pageHead({
      title: "الأسعار والباقات — عطلات رحلاتكم",
      description: "اطّلع على أسعار خدمات التأشيرات لمختلف الدول مع تفاصيل واضحة للرسوم الحكومية ورسوم الخدمة.",
      path: "/pricing",
    }),
  component: Pricing,
});
