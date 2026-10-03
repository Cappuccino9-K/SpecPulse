import type { Metadata } from "next";
import { Noto_Sans_KR } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const noto = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-noto",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SpecPulse — 하드웨어 스펙 비교와 마이너갤러리",
  description:
    "상품 페이지 두 곳의 스펙을 비교하고, CPU·그래픽카드·노트북·메모리 마이너갤에서 글을 남깁니다.",
};

const themeBoot = `
try {
  var theme = localStorage.getItem("specpulse-theme");
  if (theme === "dark" || (!theme && matchMedia("(prefers-color-scheme: dark)").matches)) {
    document.documentElement.classList.add("dark");
  }
} catch (e) {}
`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" className={noto.variable} suppressHydrationWarning>
      <head>
        {/* next/font only ships the latin subset; this stylesheet supplies Hangul. */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700&display=swap"
        />
      </head>
      <body className="antialiased">
        <Script id="specpulse-theme" strategy="beforeInteractive">
          {themeBoot}
        </Script>
        {children}
      </body>
    </html>
  );
}
