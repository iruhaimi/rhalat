import { createFileRoute } from "@tanstack/react-router";
import { pageHead } from "@/lib/routeHead";
import OfficialEmbassies from "@/pages/OfficialEmbassies";

export const Route = createFileRoute("/_main/official-embassies")({
  head: () =>
    pageHead({
      title: "روابط المواقع الرسمية للسفارات",
      description: "قائمة بروابط المواقع الحكومية الرسمية للتقديم المباشر على التأشيرات.",
      path: "/official-embassies",
    }),
  component: OfficialEmbassies,
});
