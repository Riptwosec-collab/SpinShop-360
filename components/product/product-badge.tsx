import { Box, RotateCw, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";

const CONFIG = {
  "3d": { label: "3D", icon: Box, className: "bg-accent/15 text-accent border-accent/30" },
  "360": {
    label: "360°",
    icon: RotateCw,
    className: "bg-primary/15 text-primary border-primary/30",
  },
  ar: {
    label: "AR",
    icon: Smartphone,
    className: "bg-success/15 text-success border-success/30",
  },
} as const;

export function ProductBadge({ type }: { type: keyof typeof CONFIG }) {
  const { label, icon: Icon, className } = CONFIG[type];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium backdrop-blur-glass",
        className
      )}
    >
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}
