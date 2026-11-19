import { createFileRoute } from "@tanstack/react-router";
import { pageHead } from "@/lib/routeHead";
import Blog from "@/pages/Blog";

export const Route = createFileRoute("/_main/blog/")({
  head: () =>
    pageHead({
      title: "مدونة عطلات رحلاتكم — نصائح ومعلومات التأشيرات",
      description: "مقالات وأدلة مفصلة عن تأشيرات الشنغن وبريطانيا وأمريكا، نصائح المقابلات، والمستندات المطلوبة للسفر من السعودية.",
      path: "/blog",
    }),
  component: Blog,
});
