import Image from "next/image";
import { Box, RotateCw } from "lucide-react";
import { MOCK_PRODUCTS } from "@/lib/mock-data/products";

export default function AdminMediaPage() {
  const modelsCount = MOCK_PRODUCTS.filter((p) => p.modelGlbUrl).length;
  const threeSixtyCount = MOCK_PRODUCTS.filter((p) => p.threeSixty).length;

  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold text-foreground">สื่อและโมเดล 3D</h1>
      <p className="mb-6 text-sm text-muted">
        โมเดล 3D {modelsCount} ไฟล์ • ชุดภาพหมุน 360° {threeSixtyCount} ชุด
      </p>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {MOCK_PRODUCTS.filter((p) => p.modelGlbUrl || p.threeSixty).map((p) => (
          <div key={p.id} className="overflow-hidden rounded-xl border border-border bg-surface">
            <div className="relative aspect-square bg-surface-secondary">
              <Image src={p.images[0]?.url ?? p.fallbackImageUrl} alt={p.name} fill sizes="200px" className="object-cover" />
            </div>
            <div className="p-3">
              <p className="line-clamp-1 text-xs font-medium text-foreground">{p.name}</p>
              <div className="mt-1 flex gap-2 text-[10px] text-muted">
                {p.modelGlbUrl && (
                  <span className="flex items-center gap-1">
                    <Box className="h-3 w-3" /> GLB
                  </span>
                )}
                {p.threeSixty && (
                  <span className="flex items-center gap-1">
                    <RotateCw className="h-3 w-3" /> {p.threeSixty.frameCount} เฟรม
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
