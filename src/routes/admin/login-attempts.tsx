import { createFileRoute } from "@tanstack/react-router";
import LoginAttemptsManagement from "@/pages/admin/LoginAttemptsManagement";

export const Route = createFileRoute("/admin/login-attempts")({
  component: LoginAttemptsManagement,
});
