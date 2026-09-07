"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { LoadingState } from "@/components/common/ui";

/** 게시 설정은 콘텐츠 수정 화면 안에서 함께 처리한다. */
export default function PublishPage() {
  const { contentId } = useParams<{ contentId: string }>();
  const router = useRouter();
  useEffect(() => { router.replace(`/contents/${contentId}/edit`); }, [contentId, router]);
  return <LoadingState label="콘텐츠 수정 화면으로 이동하고 있어요" />;
}
