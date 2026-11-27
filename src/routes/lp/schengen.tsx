import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/lp/schengen")({
  beforeLoad: () => {
    throw redirect({ to: "/schengen", replace: true, statusCode: 301 });
  },
});
