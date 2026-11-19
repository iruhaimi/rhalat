import { createFileRoute } from "@tanstack/react-router";
import { pageHead } from "@/lib/routeHead";
import DeleteAccount from "@/pages/DeleteAccount";

export const Route = createFileRoute("/_main/delete-account")({
  head: () =>
    pageHead({
      title: "حذف الحساب | VisaFaster",
      description: "تعرف على كيفية حذف حسابك في VisaFaster وما هي البيانات التي يتم حذفها أو الاحتفاظ بها وفقاً للأنظمة.",
      path: "/delete-account",
    }),
  component: DeleteAccount,
});
