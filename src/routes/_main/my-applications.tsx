import { createFileRoute } from "@tanstack/react-router";
import MyApplications from "@/pages/MyApplications";

export const Route = createFileRoute("/_main/my-applications")({
  component: MyApplications,
});
