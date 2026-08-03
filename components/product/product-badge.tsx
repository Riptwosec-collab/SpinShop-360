import { Box, RotateCw, Smartphone, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type ProductBadgeKind = "3d" | "360" | "ar";

interface ProductBadgeProps {
  kind: ProductBadgeKind;
}

const CONFIG: Record<ProductBadgeKind, { label: string; icon: LucideIcon; className: string }> = {
  "3d": { label: "3D", icon: Box, className: "bg-accent/15 text-accent border-accent/30" },
  "360": { label: "360°", icon: RotateCw, className: "bg-primary/15 text-primary border-primary/30" },
  ar: { label: "AR", icon: Smartphone, className: "bg-success/15 text-success border-success/30" },
};

export function ProductBadge({ kind }: ProductBadgeProps) {
  const config = CONFIG[kind];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium backdrop-blur-glass",
        config.className
      )}
    >
      <Icon aria-hidden="true" className="h-3 w-3" />
      {config.label}
    </span>
  );
}
