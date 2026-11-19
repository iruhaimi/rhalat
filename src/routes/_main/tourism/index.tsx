import { createFileRoute } from "@tanstack/react-router";
import Tourism from "@/pages/Tourism";

export const Route = createFileRoute("/_main/tourism/")({
  component: Tourism,
});
