import type { Metadata } from "next";
import { Dashboard } from "@/components/dashboard";

export const metadata: Metadata = {
  title: "스펙 비교 — SpecPulse",
  description: "상품 페이지 두 곳의 스펙과 리뷰를 나란히 비교합니다.",
};

export default function ComparePage() {
  return <Dashboard />;
}
