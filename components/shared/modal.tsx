"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/** Native dialog provides focus containment, Escape and return-to-trigger focus. */
export function Modal({ open, onClose, label, children, className }: {
  open: boolean; onClose: () => void; label: string; children: React.ReactNode; className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog || !open) return;
    dialog.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { dialog.close(); document.body.style.overflow = previous; };
  }, [open]);

  return <dialog ref={ref} aria-label={label} onCancel={(e) => { e.preventDefault(); onClose(); }}
    onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    className="fixed inset-0 m-0 h-[100dvh] max-h-none w-screen max-w-none border-0 bg-transparent p-0 text-foreground backdrop:bg-black/65 backdrop:backdrop-blur-sm open:flex">
    <div className={cn("relative flex max-h-full flex-col overflow-auto border-border bg-background shadow-soft", className)}>{children}</div>
  </dialog>;
}
