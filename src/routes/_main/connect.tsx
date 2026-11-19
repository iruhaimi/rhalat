import { createFileRoute } from "@tanstack/react-router";
import ConnectAI from "@/pages/ConnectAI";

export const Route = createFileRoute("/_main/connect")({
  component: ConnectAI,
});
