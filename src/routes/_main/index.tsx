import { createFileRoute } from "@tanstack/react-router";
import HomeArabic from "@/pages/HomeArabic";

export const Route = createFileRoute("/_main/")({
  component: HomeArabic,
});
