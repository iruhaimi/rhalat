import { createFileRoute } from "@tanstack/react-router";
import { pageHead } from "@/lib/routeHead";
import LandingVisa from "@/pages/LandingVisa";

export const Route = createFileRoute("/lp/visa")({
  head: () =>
    pageHead({
      title: "تجهيز ملفات وحجز مواعيد تأشيرات شنغن وأمريكا | عطلات رحلاتكم",
      description: "خدمات خاصة لتجهيز ملفات المواعيد والمستندات ونموذج DS-160 والحجوزات والتأمين الطبي. لسنا جهة حكومية ولا نضمن منح التأشيرة.",
      path: "/ads-visa",
    }),
  component: LandingVisa,
});
