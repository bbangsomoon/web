"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { backendApi } from "@/lib/api/backend-api";

const ACTIVE_STORE_KEY = "bbangsomoon.active-store";

const readActiveStoreId = () => typeof window === "undefined" ? "" : localStorage.getItem(ACTIVE_STORE_KEY) ?? "";

/** 현재 사이드바에서 선택한 매장을 콘텐츠·SNS 요청의 기준으로 사용한다. */
export function useSelectedStore() {
  const [activeStoreId, setActiveStoreId] = useState(readActiveStoreId);
  const stores = useQuery({ queryKey: ["stores"], queryFn: backendApi.getStores });
  const storeId = activeStoreId && stores.data?.some((store) => store.id === activeStoreId)
    ? activeStoreId
    : stores.data?.[0]?.id ?? "";

  useEffect(() => {
    const syncActiveStore = () => setActiveStoreId(readActiveStoreId());
    window.addEventListener("bbangsomoon:store-change", syncActiveStore);
    window.addEventListener("storage", syncActiveStore);
    return () => {
      window.removeEventListener("bbangsomoon:store-change", syncActiveStore);
      window.removeEventListener("storage", syncActiveStore);
    };
  }, []);

  return { storeId, stores };
}
