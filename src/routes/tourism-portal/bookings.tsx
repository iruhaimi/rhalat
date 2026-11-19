import { createFileRoute } from "@tanstack/react-router";
import TourOperatorMyBookings from "@/pages/tourism-portal/MyBookings";

export const Route = createFileRoute("/tourism-portal/bookings")({
  component: TourOperatorMyBookings,
});
