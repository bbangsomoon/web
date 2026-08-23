import { z } from "zod";

export const contentFormSchema = z.object({
  breadName: z.string().trim().min(1, "빵 이름을 적어 주세요."),
  price: z.coerce.number().min(0).optional().or(z.literal("")),
  quantity: z.string().optional(), highlights: z.string().max(160).optional(),
  promotion: z.string().max(120).optional(), additionalRequest: z.string().max(160).optional(),
  tone: z.enum(["friendly","lively","witty","premium"]), purpose: z.enum(["new_product","today_bread","promotion","event"]),
  format: z.enum(["feed","reel"]),
});
export type ContentFormValues = z.infer<typeof contentFormSchema>;
