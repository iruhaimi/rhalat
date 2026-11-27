import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/lp/brazil")({
  beforeLoad: () => {
    throw redirect({ to: "/brazil", replace: true, statusCode: 301 });
  },
});
