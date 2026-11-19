import { createFileRoute } from "@tanstack/react-router";
import { pageHead } from "@/lib/routeHead";
import Contact from "@/pages/Contact";

export const Route = createFileRoute("/_main/contact")({
  head: () =>
    pageHead({
      title: "اتصل بنا — عطلات رحلاتكم",
      description: "تواصل مع فريق دعم عطلات رحلاتكم عبر الهاتف 562525665 أو واتساب لأي استفسار حول التأشيرات.",
      path: "/contact",
    }),
  component: Contact,
});
