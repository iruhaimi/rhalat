import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/lp/japan")({
  beforeLoad: () => {
    throw redirect({ to: "/japan", replace: true, statusCode: 301 });
  },
});
