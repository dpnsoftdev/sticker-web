import { z } from "zod";

import "@/common/utils/zodExtension";

// Login
export const LoginBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password is required"),
});
export type LoginBody = z.infer<typeof LoginBodySchema>;
export const LoginSchema = z.object({ body: LoginBodySchema.strict() });

// Register — phone required (POST /auth/register and POST /auth/register/start)
const RegisterAccountBodySchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(8, "Password must be at least 8 characters"),
    name: z.string().min(1, "Name is required"),
    phone: z.string().trim().min(1, "Phone number is required.").max(30),
  })
  .strict();

export const RegisterBodySchema = RegisterAccountBodySchema;
export type RegisterBody = z.infer<typeof RegisterBodySchema>;
export const RegisterSchema = z.object({ body: RegisterBodySchema });

export const RegisterStartBodySchema = RegisterAccountBodySchema;
export type RegisterStartBody = z.infer<typeof RegisterStartBodySchema>;
export const RegisterStartSchema = z.object({ body: RegisterStartBodySchema.strict() });

export const RegisterStartResponseSchema = z.object({
  registrationSessionId: z.string().uuid(),
});
export type RegisterStartResponse = z.infer<typeof RegisterStartResponseSchema>;

// Register with email OTP — step 2: verify code and create account
export const RegisterVerifyBodySchema = z.object({
  registrationSessionId: z.string().uuid(),
  otp: z.string().regex(/^\d{6}$/, "OTP must be 6 digits"),
});
export type RegisterVerifyBody = z.infer<typeof RegisterVerifyBodySchema>;
export const RegisterVerifySchema = z.object({ body: RegisterVerifyBodySchema.strict() });

export const RegisterVerifyFailureDataSchema = z.object({
  attemptsRemaining: z.number().int().min(0).optional(),
});
export type RegisterVerifyFailureData = z.infer<typeof RegisterVerifyFailureDataSchema>;

// Refresh token
export const RefreshBodySchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});
export type RefreshBody = z.infer<typeof RefreshBodySchema>;
export const RefreshSchema = z.object({ body: RefreshBodySchema.strict() });

// Token response (login / register / refresh)
export const TokenResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresIn: z.number().describe("Access token TTL in seconds"),
  user: z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    name: z.string(),
    role: z.enum(["owner", "customer"]),
  }),
});
export type TokenResponse = z.infer<typeof TokenResponseSchema>;

// PATCH /auth/me — profile fields
export const UpdateProfileBodySchema = z
  .object({
    name: z.string().min(1).max(120).trim().optional(),
    phone: z.union([z.string().max(30).trim(), z.literal("")]).optional(),
  })
  .strict()
  .superRefine((val, ctx) => {
    if (val.name === undefined && val.phone === undefined) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Provide at least one field to update" });
    }
  });
export type UpdateProfileBody = z.infer<typeof UpdateProfileBodySchema>;
export const UpdateProfileSchema = z.object({ body: UpdateProfileBodySchema });

// PATCH /auth/me/password
export const ChangePasswordBodySchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters").max(128),
});
export type ChangePasswordBody = z.infer<typeof ChangePasswordBodySchema>;
export const ChangePasswordSchema = z.object({ body: ChangePasswordBodySchema.strict() });
