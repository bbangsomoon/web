import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const steps = ["AI 생성 요청", "결과 확인"];

export function ContentStepIndicator({ step }: { step: 1 | 2 }) {
  return <ol className="mb-8 grid grid-cols-2 gap-1" aria-label="콘텐츠 생성 진행 단계">
    {steps.map((label, index) => {
      const number = index + 1;
      return <li key={label} className="relative text-center">
        {index < steps.length - 1 && <div className={cn("absolute left-1/2 top-4 h-[2px] w-full -translate-y-1/2", number < step ? "bg-emerald-500" : "bg-stone-200")} />}
        <div className={cn("relative z-10 mx-auto grid size-8 place-items-center rounded-full text-xs font-black transition", number < step ? "bg-emerald-600 text-white" : number === step ? "bg-[#ef6b32] text-white shadow-[0_0_0_5px_rgba(239,107,50,.12)]" : "bg-stone-200 text-stone-500")}>{number < step ? <Check className="size-4" /> : number}</div>
        <p className={cn("mt-2 text-xs font-bold", number === step ? "text-[#d95320]" : "text-stone-400")}>{label}</p>
      </li>;
    })}
  </ol>;
}
