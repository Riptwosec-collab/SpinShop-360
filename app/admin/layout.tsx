import { LocaleSwitcher } from "@/lib/i18n/locale-switcher";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminGuard } from "@/components/admin/admin-guard";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <div className="min-w-0 flex-1">
        <div className="flex justify-end border-b border-border px-4 py-3"><LocaleSwitcher /></div>
        <AdminGuard>
          <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">{children}</div>
        </AdminGuard>
      </div>
    </div>
  );
}
