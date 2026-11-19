import { createFileRoute } from "@tanstack/react-router";
import { pageHead } from "@/lib/routeHead";
import About from "@/pages/About";

export const Route = createFileRoute("/_main/about")({
  head: () =>
    pageHead({
      title: "من نحن — عطلات رحلاتكم",
      description: "عطلات رحلاتكم وكالة سفر خاصة تقدم خدمات تجهيز ومراجعة ملفات طلبات التأشيرة والمساعدة في المواعيد وخدمات السفر. لسنا جهة حكومية ولا نصدر التأشيرات.",
      path: "/about",
    }),
  component: About,
});
