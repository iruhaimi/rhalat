import { createFileRoute } from "@tanstack/react-router";
import BlogPostEditor from "@/pages/admin/BlogPostEditor";

export const Route = createFileRoute("/admin/blog/new")({
  component: BlogPostEditor,
});
