"use client";

import { useParams } from "next/navigation";
import { GalleryBoard } from "@/components/gallery/gallery-board";

export default function GallerySlugPage() {
  const params = useParams<{ slug: string }>();
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;
  return <GalleryBoard slug={slug} />;
}
