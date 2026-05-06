import { z } from "zod";

import "@/common/utils/zodExtension";

export type User = z.infer<typeof UserSchema>;
export const UserSchema = z
  .object({
    id: z.string().uuid(),
    name: z.string(),
    email: z.string().email(),
    phone: z.string().nullable(),
    avatar: z.string().nullable(),
    emailVerified: z.boolean(),
    phoneVerified: z.boolean(),
    role: z.enum(["owner", "customer"]),
    createdAt: z.date(),
    updatedAt: z.date(),
  })
  .openapi("User");

// Input Validation for 'GET users/:id' endpoint
export const GetUserSchema = z.object({
  params: z.object({ id: z.string().uuid() }).strict(),
});
