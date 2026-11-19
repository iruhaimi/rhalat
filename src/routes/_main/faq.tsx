import { createFileRoute } from "@tanstack/react-router";
import { pageHead } from "@/lib/routeHead";
import FAQ from "@/pages/FAQ";

export const Route = createFileRoute("/_main/faq")({
  head: () =>
    pageHead({
      title: "الأسئلة الشائعة — عطلات رحلاتكم",
      description: "إجابات على أكثر الأسئلة شيوعًا حول التقديم على التأشيرات، المستندات، الأسعار، وأوقات المعالجة.",
      path: "/faq",
    }),
  component: FAQ,
});
