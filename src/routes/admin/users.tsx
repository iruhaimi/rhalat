import { createFileRoute } from "@tanstack/react-router";
import UsersManagement from "@/pages/admin/UsersManagement";

export const Route = createFileRoute("/admin/users")({
  component: UsersManagement,
});
