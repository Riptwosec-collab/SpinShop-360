import type { Metadata, Viewport } from "next";
import { Providers } from "@/components/shared/providers";
import "@fontsource/ibm-plex-sans-thai/400.css";
import "@fontsource/ibm-plex-sans-thai/500.css";
import "@fontsource/ibm-plex-sans-thai/600.css";
import "@fontsource/ibm-plex-sans-thai/700.css";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "SpinShop 360 — See every angle", template: "%s | SpinShop 360" },
  description: "หมุนดูก่อนซื้อ สำรวจสินค้าแบบ 3D และ 360 องศา",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#080d18" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `try{var t=localStorage.getItem('spinshop360-theme');document.documentElement.classList.toggle('light',t==='light');document.documentElement.classList.toggle('dark',t!=='light')}catch(e){}` }} />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
