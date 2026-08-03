import { PackageSearch } from "lucide-react";
import Link from "next/link";

export function EmptyState({
  title = "ไม่พบสินค้า",
  description = "ลองปรับตัวกรองหรือค้นหาด้วยคำอื่น",
  actionHref,
  actionLabel,
}: {
  title?: string;
  description?: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border py-20 text-center">
      <PackageSearch className="h-10 w-10 text-muted" />
      <h3 className="text-base font-medium text-foreground">{title}</h3>
      <p className="max-w-xs text-sm text-muted">{description}</p>
      {actionHref && actionLabel && (
        <Link
          href={actionHref}
          className="focus-ring mt-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
