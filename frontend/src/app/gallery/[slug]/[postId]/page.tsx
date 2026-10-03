"use client";

import { useParams } from "next/navigation";
import { PostView } from "@/components/gallery/post-view";

export default function PostPage() {
  const params = useParams<{ slug: string; postId: string }>();
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;
  const raw = Array.isArray(params.postId) ? params.postId[0] : params.postId;
  const postId = Number(raw);
  if (!Number.isFinite(postId)) {
    return <p className="p-6 text-sm text-muted">글 번호가 올바르지 않습니다.</p>;
  }
  return <PostView slug={slug} postId={postId} />;
}
