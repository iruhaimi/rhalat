import { createFileRoute } from "@tanstack/react-router";
import { pageHead } from "@/lib/routeHead";
import Privacy from "@/pages/Privacy";

export const Route = createFileRoute("/_main/privacy")({
  head: () =>
    pageHead({
      title: "سياسة الخصوصية — عطلات رحلاتكم",
      description: "تعرف على كيفية حماية بياناتك الشخصية وفقًا لنظام حماية البيانات الشخصية في المملكة العربية السعودية.",
      path: "/privacy",
    }),
  component: Privacy,
});
