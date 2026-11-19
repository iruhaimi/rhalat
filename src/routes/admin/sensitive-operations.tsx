import { createFileRoute } from "@tanstack/react-router";
import SensitiveOperations from "@/pages/admin/SensitiveOperations";

export const Route = createFileRoute("/admin/sensitive-operations")({
  component: SensitiveOperations,
});
