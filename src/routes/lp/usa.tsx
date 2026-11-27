import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/lp/usa")({
  beforeLoad: () => {
    throw redirect({ to: "/usa", replace: true, statusCode: 301 });
  },
});
