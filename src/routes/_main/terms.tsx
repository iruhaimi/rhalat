import { createFileRoute } from "@tanstack/react-router";
import { pageHead } from "@/lib/routeHead";
import Terms from "@/pages/Terms";

export const Route = createFileRoute("/_main/terms")({
  head: () =>
    pageHead({
      title: "الشروط والأحكام — عطلات رحلاتكم",
      description: "اطّلع على الشروط والأحكام الخاصة باستخدام خدمات منصة عطلات رحلاتكم للتأشيرات.",
      path: "/terms",
    }),
  component: Terms,
});
