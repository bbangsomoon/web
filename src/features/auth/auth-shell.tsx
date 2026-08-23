import Image from "next/image";
import { Logo } from "@/components/common/ui";
import { LegalFooter } from "@/components/common/legal-footer";
import { cn } from "@/lib/utils";

export function AuthShell({ eyebrow, title, description, children, footer }: { eyebrow?: string; title: string; description?: string; children: React.ReactNode; footer?: React.ReactNode }) {
  return <main className="grid min-h-screen bg-[#fbfaf6] lg:grid-cols-[1fr_1.05fr]">
    <section className="flex min-h-screen flex-col px-5 py-6 sm:px-10 lg:px-14"><header><Logo href="/"/></header><div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-12">{eyebrow && <p className="text-sm font-semibold text-[#d95320]">{eyebrow}</p>}<h1 className={cn("text-3xl font-semibold tracking-[-.045em] text-stone-900 sm:text-4xl", eyebrow && "mt-2")}>{title}</h1>{description && <p className="mt-3 text-sm leading-6 text-stone-500">{description}</p>}<div className="mt-8">{children}</div>{footer && <div className="mt-7 text-center text-sm text-stone-500">{footer}</div>}</div><LegalFooter className="mt-6 border-t pt-5"/></section>
    <aside className="relative hidden overflow-hidden bg-stone-900 lg:block"><Image src="/images/bakery-hero.png" alt="햇살 아래 놓인 갓 구운 빵" fill priority sizes="52vw" className="object-cover"/><div className="absolute inset-0 bg-gradient-to-t from-stone-950/70 via-transparent to-stone-950/10"/><div className="absolute inset-x-0 bottom-0 p-12 text-white"><p className="text-3xl font-semibold leading-tight tracking-[-.04em]">빵 굽는 마음은 그대로,<br/>소문내는 일은 더 가볍게.</p><p className="mt-4 text-sm text-white/70">사진 한 장으로 시작하는 우리 매장 SNS 마케팅</p></div></aside>
  </main>;
}
