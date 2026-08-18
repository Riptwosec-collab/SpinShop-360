import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminGuard } from "@/components/admin/admin-guard";
import { requireAdminSession } from "@/lib/admin-auth";
import { USE_MOCK_DATA } from "@/lib/constants";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!USE_MOCK_DATA) {
    const session = await requireAdminSession();
    if (!session) redirect("/login?next=/admin");
  }

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <div className="min-w-0 flex-1">
        <AdminGuard enabled={USE_MOCK_DATA}>
          <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">{children}</div>
        </AdminGuard>
      </div>
    </div>
  );
}
