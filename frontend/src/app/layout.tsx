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
  title: "SpecPulse — 하드웨어 스펙 비교와 리뷰 감성 분석",
  description:
    "노트북, 태블릿, 그래픽카드 페이지 두 곳을 읽어 스펙 우위, 실사용자 장단점, 구매 가이드를 한 화면에 정리합니다.",
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
      <body className="antialiased">
        <Script id="specpulse-theme" strategy="beforeInteractive">
          {themeBoot}
        </Script>
        {children}
      </body>
    </html>
  );
}
