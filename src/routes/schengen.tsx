import { createFileRoute } from "@tanstack/react-router";
import { pageHead } from "@/lib/routeHead";
import { MARKET_LANDINGS } from "@/config/marketLandings";
import MarketLandingPage from "@/pages/MarketLandingPage";

const m = MARKET_LANDINGS.schengen;

export const Route = createFileRoute("/schengen")({
  head: () => pageHead({ title: m.seoTitle, description: m.seoDescription, path: m.path }),
  component: () => <MarketLandingPage market="schengen" />,
});
