import { cn } from "@/lib/utils";

export function LegalFooter({ dark = false, className }: { dark?: boolean; className?: string }) {
  return <footer className={cn("text-center text-[11px] leading-5", dark ? "border-white/20 text-white" : "border-stone-200 text-stone-400", className)}><p>© 2026 빵소문. All rights reserved.</p><p><span>개인정보처리방침</span><span className={cn("mx-2", dark ? "text-white/50" : "text-stone-300")} aria-hidden="true">|</span><span>서비스 이용약관</span></p></footer>;
}
