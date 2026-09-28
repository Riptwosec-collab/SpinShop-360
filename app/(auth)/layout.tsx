import { LocaleSwitcher } from "@/lib/i18n/locale-switcher";
import Link from "next/link";
import { Rotate3d } from "lucide-react";
import { APP_NAME } from "@/lib/constants";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-6 sm:px-6">
        <Link href="/" className="focus-ring inline-flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent">
            <Rotate3d className="h-5 w-5 text-white" />
          </span>
          <span className="text-lg font-semibold">{APP_NAME}</span>
        </Link>
        <LocaleSwitcher />
      </div>
      {children}
    </div>
  );
}
