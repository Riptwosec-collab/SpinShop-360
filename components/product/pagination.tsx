"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function Pagination({ page, totalPages }: { page: number; totalPages: number }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  if (totalPages <= 1) return null;

  function goTo(p: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(p));
    router.push(`/products?${params.toString()}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1
  );

  return (
    <nav className="mt-8 flex items-center justify-center gap-1" aria-label="เปลี่ยนหน้า">
      <button
        onClick={() => goTo(page - 1)}
        disabled={page <= 1}
        aria-label="หน้าก่อนหน้า"
        className="focus-ring flex h-9 w-9 items-center justify-center rounded-lg border border-border text-foreground disabled:opacity-30"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      {pages.map((p, i) => (
        <span key={p} className="flex items-center">
          {i > 0 && pages[i - 1] !== p - 1 && <span className="px-1 text-muted">…</span>}
          <button
            onClick={() => goTo(p)}
            aria-current={p === page}
            className={`focus-ring flex h-9 w-9 items-center justify-center rounded-lg border text-sm ${
              p === page ? "border-primary bg-primary/15 text-primary" : "border-border text-foreground hover:border-primary/40"
            }`}
          >
            {p}
          </button>
        </span>
      ))}
      <button
        onClick={() => goTo(page + 1)}
        disabled={page >= totalPages}
        aria-label="หน้าถัดไป"
        className="focus-ring flex h-9 w-9 items-center justify-center rounded-lg border border-border text-foreground disabled:opacity-30"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );
}
