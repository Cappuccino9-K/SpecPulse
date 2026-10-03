"use client";

import { useParams } from "next/navigation";
import { WritePost } from "@/components/gallery/write-post";

export default function WritePage() {
  const params = useParams<{ slug: string }>();
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;
  return <WritePost slug={slug} />;
}
