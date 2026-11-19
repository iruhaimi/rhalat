import { createFileRoute } from "@tanstack/react-router";
import { pageHead } from "@/lib/routeHead";
import Tourism from "@/pages/Tourism";

export const Route = createFileRoute("/_main/tourism/")({
  head: () =>
    pageHead({
      title: "البرامج السياحية — عطلات رحلاتكم",
      description: "باقات سفر وعطلات سياحية مختارة من شركاء معتمدين، احجز برنامجك التالي بسهولة.",
      path: "/tourism",
    }),
  component: Tourism,
});
