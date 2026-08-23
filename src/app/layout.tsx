import type { Metadata, Viewport } from "next";
import { Providers } from "@/components/common/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "빵소문", template: "%s | 빵소문" },
  description: "빵집을 위한 쉽고 따뜻한 AI SNS 마케팅 서비스",
  applicationName: "빵소문",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon.svg", apple: "/icon.svg" },
};

export const viewport: Viewport = { themeColor: "#ef6b32", colorScheme: "light", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body><Providers>{children}</Providers></body>
    </html>
  );
}
