import Link from "next/link";
import { cn } from "@/lib/utils";

export function LegalFooter({ dark = false, className }: { dark?: boolean; className?: string }) {
  return <footer className={cn("text-center text-[11px] leading-5", dark ? "border-white/20 text-white" : "border-stone-200 text-stone-400", className)}><p>© 2026 빵소문. All rights reserved.</p><p><Link href="/privacy" className="focus-ring rounded hover:underline">개인정보처리방침</Link><span className={cn("mx-2", dark ? "text-white/50" : "text-stone-300")} aria-hidden="true">|</span><Link href="/terms" className="focus-ring rounded hover:underline">서비스 이용약관</Link></p></footer>;
}
