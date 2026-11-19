import { createFileRoute } from "@tanstack/react-router";
import BlogManagement from "@/pages/admin/BlogManagement";

export const Route = createFileRoute("/admin/blog/")({
  component: BlogManagement,
});
