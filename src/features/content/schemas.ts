import { z } from "zod";

export const contentFormSchema = z.object({
  prompt: z.string().trim().max(1000, "요청 내용은 1,000자 이하로 입력해 주세요."),
});
export type ContentFormValues = z.infer<typeof contentFormSchema>;
