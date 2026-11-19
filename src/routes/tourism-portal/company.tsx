import { createFileRoute } from "@tanstack/react-router";
import TourOperatorCompanyProfile from "@/pages/tourism-portal/CompanyProfile";

export const Route = createFileRoute("/tourism-portal/company")({
  component: TourOperatorCompanyProfile,
});
