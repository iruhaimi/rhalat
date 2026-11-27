import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/lp/uk")({
  beforeLoad: () => {
    throw redirect({ to: "/uk", replace: true, statusCode: 301 });
  },
});
