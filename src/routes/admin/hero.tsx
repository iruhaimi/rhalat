import { createFileRoute } from "@tanstack/react-router";
import HeroManagement from "@/pages/admin/HeroManagement";

export const Route = createFileRoute("/admin/hero")({
  component: HeroManagement,
});
