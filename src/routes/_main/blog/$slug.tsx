import { createFileRoute } from "@tanstack/react-router";
import BlogPost from "@/pages/BlogPost";

export const Route = createFileRoute("/_main/blog/$slug")({
  component: BlogPost,
});
