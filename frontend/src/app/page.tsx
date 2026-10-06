import type { Metadata } from "next";
import { LandingPage } from "@/components/landing/landing-page";

export const metadata: Metadata = {
  title: "SpecPulse — 두 주소로 스펙을 나란히",
  description: "상품 페이지 두 곳을 비교해 구매 가이드를 만들고, 그 비교를 마이너갤에 남깁니다.",
};

export default function HomePage() {
  return <LandingPage />;
}
