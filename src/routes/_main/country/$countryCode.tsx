import { createFileRoute } from "@tanstack/react-router";
import CountryDetail from "@/pages/CountryDetail";

export const Route = createFileRoute("/_main/country/$countryCode")({
  component: CountryDetail,
});
