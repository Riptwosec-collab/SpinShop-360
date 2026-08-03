"use client";

import { UploadCloud } from "lucide-react";

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="rounded-2xl border border-border bg-surface p-5">
      <legend className="mb-4 px-1 text-sm font-semibold text-foreground">{title}</legend>
      <div className="flex flex-col gap-4">{children}</div>
    </fieldset>
  );
}

export function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-foreground">{label}</span>
      {children}
    </label>
  );
}

export function UploadBox({ label, hint }: { label: string; hint: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <div className="flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-border p-6 text-center transition-colors hover:border-primary/40">
        <UploadCloud className="h-6 w-6 text-muted" />
        <p className="text-xs text-muted">คลิกหรือลากไฟล์มาวางที่นี่</p>
        <p className="text-[11px] text-muted">{hint}</p>
      </div>
    </div>
  );
}

export function ToggleCard({
  label,
  icon: Icon,
  checked,
  onChange,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      aria-pressed={checked}
      className={`focus-ring flex items-center gap-2 rounded-xl border px-4 py-3 text-sm transition-colors ${
        checked ? "border-primary bg-primary/15 text-primary" : "border-border text-muted hover:border-primary/30"
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}
