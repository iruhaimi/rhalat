import { createFileRoute } from "@tanstack/react-router";
import SEOContentManagement from "@/pages/admin/SEOContentManagement";

export const Route = createFileRoute("/admin/seo-content")({
  component: SEOContentManagement,
});
