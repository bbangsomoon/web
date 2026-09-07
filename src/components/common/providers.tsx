"use client";
import { MutationCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createContext, useCallback, useContext, useState } from "react";
import { CheckCircle2, CircleAlert, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastVariant = "success" | "info" | "error";
type ShowToast = (message: string, variant?: ToastVariant) => void;
type ToastState = { id: number; message: string; variant: ToastVariant };

const ToastContext = createContext<ShowToast>(() => undefined);
export const useToast = () => useContext(ToastContext);

const toastMeta = {
  success: { icon: CheckCircle2, iconClass: "text-emerald-700", surfaceClass: "border-emerald-200 bg-emerald-50" },
  info: { icon: Info, iconClass: "text-blue-700", surfaceClass: "border-blue-200 bg-blue-50" },
  error: { icon: CircleAlert, iconClass: "text-red-700", surfaceClass: "border-red-200 bg-red-50" },
} satisfies Record<ToastVariant, { icon: typeof CheckCircle2; iconClass: string; surfaceClass: string }>;

export function Providers({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const showToast = useCallback<ShowToast>((message, variant = "success") => {
    const id = Date.now();
    setToast({ id, message, variant });
    window.setTimeout(() => setToast((current) => current?.id === id ? null : current), 3000);
  }, []);
  const [queryClient] = useState(() => new QueryClient({
    mutationCache: new MutationCache({ onError: (error) => showToast(error instanceof Error ? error.message : "요청을 처리하지 못했어요. 잠시 후 다시 시도해 주세요.", "error") }),
    defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
  }));
  const meta = toast ? toastMeta[toast.variant] : null;
  const ToastIcon = meta?.icon;
  return <QueryClientProvider client={queryClient}><ToastContext.Provider value={showToast}>{children}
    {toast && meta && ToastIcon && (
      <div className="pointer-events-none fixed inset-x-0 top-[calc(env(safe-area-inset-top)+1rem)] z-[100] flex justify-center px-4">
        <div key={toast.id} role={toast.variant === "error" ? "alert" : "status"} aria-live={toast.variant === "error" ? "assertive" : "polite"} className={cn("toast-in pointer-events-auto flex w-fit max-w-full items-center gap-3 rounded-2xl border px-4 py-3.5 text-sm font-semibold text-stone-800 shadow-[0_14px_38px_rgba(41,37,32,.16)]", meta.surfaceClass)}><ToastIcon className={cn("size-5 shrink-0", meta.iconClass)} /><span className="min-w-0 leading-5">{toast.message}</span></div>
      </div>
    )}
  </ToastContext.Provider></QueryClientProvider>;
}
