import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/lp/canada")({
  beforeLoad: () => {
    throw redirect({ to: "/canada", replace: true, statusCode: 301 });
  },
});
