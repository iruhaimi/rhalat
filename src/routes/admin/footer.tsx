import { createFileRoute } from "@tanstack/react-router";
import FooterManagement from "@/pages/admin/FooterManagement";

export const Route = createFileRoute("/admin/footer")({
  component: FooterManagement,
});
