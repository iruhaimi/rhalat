import { createFileRoute } from "@tanstack/react-router";
import MyApplicationDetail from "@/pages/MyApplicationDetail";

export const Route = createFileRoute("/_main/application")({
  component: MyApplicationDetail,
});
