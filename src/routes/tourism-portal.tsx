import { createFileRoute } from "@tanstack/react-router";
import ProtectedRoute from "@/components/admin/ProtectedRoute";
import TourOperatorLayout from "@/components/tourism/TourOperatorLayout";

export const Route = createFileRoute("/tourism-portal")({
  component: () => (
    <ProtectedRoute allowedRoles={['tour_operator']}>
      <TourOperatorLayout />
    </ProtectedRoute>
  ),
});
