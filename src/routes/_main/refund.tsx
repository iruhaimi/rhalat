import { createFileRoute } from "@tanstack/react-router";
import { pageHead } from "@/lib/routeHead";
import Refund from "@/pages/Refund";

export const Route = createFileRoute("/_main/refund")({
  head: () =>
    pageHead({
      title: "سياسة الاسترداد — عطلات رحلاتكم",
      description: "تفاصيل سياسة الاسترداد ومتى يحق لك استرداد المبالغ المدفوعة لخدمات التأشيرات.",
      path: "/refund",
    }),
  component: Refund,
});
