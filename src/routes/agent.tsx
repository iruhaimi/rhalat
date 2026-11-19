import { createFileRoute } from "@tanstack/react-router";
import ProtectedRoute from "@/components/admin/ProtectedRoute";
import AgentLayout from "@/components/agent/AgentLayout";

export const Route = createFileRoute("/agent")({
  component: () => (
    <ProtectedRoute allowedRoles={['agent', 'admin']}>
      <AgentLayout />
    </ProtectedRoute>
  ),
});
