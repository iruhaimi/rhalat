import { createFileRoute } from "@tanstack/react-router";
import DeleteAccount from "@/pages/DeleteAccount";

export const Route = createFileRoute("/_main/delete-account")({
  component: DeleteAccount,
});
