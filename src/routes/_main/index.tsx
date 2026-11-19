import { createFileRoute } from "@tanstack/react-router";
import { pageHead } from "@/lib/routeHead";
import HomeArabic from "@/pages/HomeArabic";

export const Route = createFileRoute("/_main/")({
  head: () =>
    pageHead({
      title: "عطلات رحلاتكم — تجهيز ومراجعة ملفات طلبات التأشيرة",
      description: "وكالة سفر خاصة تقدم خدمات تجهيز ومراجعة ملفات طلبات التأشيرة والمساعدة في المواعيد وخدمات السفر. لا نصدر التأشيرات ولا نضمن قبولها.",
      path: "/",
    }),
  component: HomeArabic,
});
