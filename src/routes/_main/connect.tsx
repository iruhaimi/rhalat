import { createFileRoute } from "@tanstack/react-router";
import { pageHead } from "@/lib/routeHead";
import ConnectAI from "@/pages/ConnectAI";

export const Route = createFileRoute("/_main/connect")({
  head: () =>
    pageHead({
      title: "ربط المساعد الذكي | عطلات رحلاتكم",
      description: "اربط ChatGPT أو Claude بحسابك في عطلات رحلاتكم.",
      path: "/connect",
    }),
  component: ConnectAI,
});
