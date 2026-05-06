import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { randomInt, randomUUID } from "node:crypto";
import { StatusCodes } from "http-status-codes";

import type {
  LoginBody,
  RegisterBody,
  RegisterStartBody,
  RegisterVerifyBody,
  TokenResponse,
} from "@/api/auth/authModel";
import { emailService } from "@/api/email/emailService";
import { UserRepository } from "@/api/user/userRepository";
import { ServiceResponse } from "@/common/models/serviceResponse";
import { getRedis } from "@/common/lib/redis-client";
import { env } from "@/common/utils/envConfig";
import { consumeOtpRequestSlot, generateIPKeyForRegistrationStart } from "@/common/utils/otpRateLimit";
import { normalizeVietnamPhone } from "@/common/utils/otpVerification";
import { logger } from "@/index";
import type { UserRole } from "@/common/lib/prisma-client";

const userRepository = new UserRepository();
const SALT_ROUNDS = 10;
const OTP_SALT_ROUNDS = 4;

type RegistrationSessionRecord = {
  email: string;
  name: string;
  /** Normalized VN mobile local form 0xxxxxxxxx */
  phone: string;
  passwordHash: string;
  otpHash: string;
  verifyAttemptsLeft: number;
};

function registrationSessionKey(sessionId: string): string {
  return `auth:reg:${sessionId}`;
}

function generateSixDigitOtp(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

function signAccessToken(payload: { sub: string; email: string; role: UserRole }): string {
  return jwt.sign({ ...payload, type: "access" }, env.JWT_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as unknown as number,
  });
}

function signRefreshToken(payload: { sub: string; email: string; role: UserRole }): string {
  return jwt.sign({ ...payload, type: "refresh" }, env.JWT_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as unknown as number,
  });
}

function getExpiresInSeconds(expiresIn: string): number {
  const match = expiresIn.match(/^(\d+)([smhd])$/);
  if (!match) return 900; // default 15 min in seconds
  const [, num, unit] = match;
  const n = parseInt(num!, 10);
  const multipliers: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400 };
  return n * (multipliers[unit!] ?? 60);
}

export const authService = {
  async login(body: LoginBody): Promise<ServiceResponse<TokenResponse | null>> {
    try {
      const user = await userRepository.findByEmailAsync(body.email);
      if (!user) {
        return ServiceResponse.failure("Invalid email or password", null, StatusCodes.UNAUTHORIZED);
      }
      if (user.status !== "active") {
        return ServiceResponse.failure("Account is not active", null, StatusCodes.FORBIDDEN);
      }
      const valid = await bcrypt.compare(body.password, user.passwordHash);
      if (!valid) {
        return ServiceResponse.failure("Invalid email or password", null, StatusCodes.UNAUTHORIZED);
      }
      await userRepository.updateLastLoginAt(user.id);
      const accessToken = signAccessToken({
        sub: user.id,
        email: user.email,
        role: user.role as UserRole,
      });
      const refreshToken = signRefreshToken({
        sub: user.id,
        email: user.email,
        role: user.role as UserRole,
      });
      const expiresInSeconds = getExpiresInSeconds(env.JWT_ACCESS_EXPIRES_IN);
      return ServiceResponse.success<TokenResponse>("Login successful", {
        accessToken,
        refreshToken,
        expiresIn: expiresInSeconds,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role as "owner" | "customer",
        },
      });
    } catch (ex) {
      logger.error(`Auth login error: ${(ex as Error).message}`);
      return ServiceResponse.failure("An error occurred during login.", null, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  },

  async register(body: RegisterBody): Promise<ServiceResponse<TokenResponse | null>> {
    try {
      const existing = await userRepository.findByEmailAsync(body.email);
      if (existing) {
        return ServiceResponse.failure("Email already registered", null, StatusCodes.CONFLICT);
      }
      const pn = normalizeVietnamPhone(body.phone);
      if (!pn.ok) {
        return ServiceResponse.failure(pn.message, null, StatusCodes.BAD_REQUEST);
      }
      const passwordHash = await bcrypt.hash(body.password, SALT_ROUNDS);
      const user = await userRepository.createAsync({
        email: body.email,
        passwordHash,
        name: body.name,
        role: "customer",
        phone: pn.phone.local,
      });
      const fullUser = await userRepository.findByEmailAsync(body.email);
      if (!fullUser) {
        return ServiceResponse.failure("Failed to create user", null, StatusCodes.INTERNAL_SERVER_ERROR);
      }
      const accessToken = signAccessToken({
        sub: user.id,
        email: user.email,
        role: "customer",
      });
      const refreshToken = signRefreshToken({
        sub: user.id,
        email: user.email,
        role: "customer",
      });
      const expiresInSeconds = getExpiresInSeconds(env.JWT_ACCESS_EXPIRES_IN);
      return ServiceResponse.success<TokenResponse>(
        "Registration successful",
        {
          accessToken,
          refreshToken,
          expiresIn: expiresInSeconds,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: "customer",
          },
        },
        StatusCodes.CREATED,
      );
    } catch (ex) {
      logger.error(`Auth register error: ${(ex as Error).message}`);
      return ServiceResponse.failure("An error occurred during registration.", null, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  },

  async startRegistration(
    body: RegisterStartBody,
    clientIp: string,
  ): Promise<ServiceResponse<{ registrationSessionId: string } | null>> {
    const redis = getRedis();
    if (!redis) {
      return ServiceResponse.failure(
        "Đăng ký qua email tạm thời không khả dụng. Vui lòng thử lại sau.",
        null,
        StatusCodes.SERVICE_UNAVAILABLE,
      );
    }

    try {
      const rate = await consumeOtpRequestSlot(redis, generateIPKeyForRegistrationStart(clientIp), {
        ttl: env.REGISTRATION_OTP_TTL_SEC,
        limit: env.REGISTRATION_OTP_MAX_VERIFY_ATTEMPTS,
      });
      if (!rate.allowed) {
        return ServiceResponse.failure(
          "Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau.",
          null,
          StatusCodes.TOO_MANY_REQUESTS,
        );
      }

      const email = body.email.trim().toLowerCase();
      const existing = await userRepository.findByEmailAsync(email);
      if (existing) {
        return ServiceResponse.failure("Email đã được đăng ký.", null, StatusCodes.CONFLICT);
      }

      const phoneNorm = normalizeVietnamPhone(body.phone);
      if (!phoneNorm.ok) {
        return ServiceResponse.failure(phoneNorm.message, null, StatusCodes.BAD_REQUEST);
      }

      const passwordHash = await bcrypt.hash(body.password, SALT_ROUNDS);
      const otp = generateSixDigitOtp();
      const otpHash = await bcrypt.hash(otp, OTP_SALT_ROUNDS);
      const sessionId = randomUUID();
      const ttl = Math.max(60, env.REGISTRATION_OTP_TTL_SEC || 300);
      const maxAttempts = Math.max(1, env.REGISTRATION_OTP_MAX_VERIFY_ATTEMPTS || 5);

      const record: RegistrationSessionRecord = {
        email,
        name: body.name.trim(),
        phone: phoneNorm.phone.local,
        passwordHash,
        otpHash,
        verifyAttemptsLeft: maxAttempts,
      };

      await redis.setex(registrationSessionKey(sessionId), ttl, JSON.stringify(record));

      let delivered = false;
      if (emailService.isConfigured()) {
        delivered = await emailService.sendRegistrationOtp(email, otp);
      } else if (env.NODE_ENV === "development") {
        logger.warn({ email, otp, sessionId }, "Registration OTP (dev: SMTP not configured)");
        delivered = true;
      }

      if (!delivered) {
        await redis.del(registrationSessionKey(sessionId));
        return ServiceResponse.failure(
          "Không thể gửi email xác nhận. Vui lòng kiểm tra cấu hình hệ thống hoặc thử lại sau.",
          null,
          StatusCodes.SERVICE_UNAVAILABLE,
        );
      }

      return ServiceResponse.success<{ registrationSessionId: string }>(
        "Đã gửi mã xác nhận đến email của bạn.",
        { registrationSessionId: sessionId },
        StatusCodes.OK,
      );
    } catch (ex) {
      logger.error(`Auth startRegistration error: ${(ex as Error).message}`);
      return ServiceResponse.failure("Đã xảy ra lỗi khi gửi mã xác nhận.", null, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  },

  async verifyRegistration(
    body: RegisterVerifyBody,
  ): Promise<ServiceResponse<TokenResponse | null | { attemptsRemaining: number }>> {
    const redis = getRedis();
    if (!redis) {
      return ServiceResponse.failure(
        "Đăng ký qua email tạm thời không khả dụng. Vui lòng thử lại sau.",
        null,
        StatusCodes.SERVICE_UNAVAILABLE,
      );
    }

    const key = registrationSessionKey(body.registrationSessionId);

    try {
      const raw = await redis.get(key);
      if (!raw) {
        return ServiceResponse.failure(
          "Phiên đăng ký đã hết hạn hoặc không hợp lệ. Vui lòng nhập lại thông tin đăng ký.",
          null,
          StatusCodes.GONE,
        );
      }

      let session: RegistrationSessionRecord;
      try {
        session = JSON.parse(raw) as RegistrationSessionRecord;
      } catch {
        await redis.del(key);
        return ServiceResponse.failure(
          "Phiên đăng ký đã hết hạn hoặc không hợp lệ. Vui lòng nhập lại thông tin đăng ký.",
          null,
          StatusCodes.GONE,
        );
      }

      if (typeof session.phone !== "string" || session.phone.trim() === "") {
        await redis.del(key);
        return ServiceResponse.failure(
          "Phiên đăng ký đã hết hạn hoặc không hợp lệ. Vui lòng nhập lại thông tin đăng ký.",
          null,
          StatusCodes.GONE,
        );
      }

      const otpOk = await bcrypt.compare(body.otp, session.otpHash);
      if (!otpOk) {
        session.verifyAttemptsLeft -= 1;
        const ttl = await redis.ttl(key);
        if (session.verifyAttemptsLeft <= 0 || ttl <= 0) {
          await redis.del(key);
          return ServiceResponse.failure("Đã hết số lần thử. Vui lòng đăng ký lại thông tin.", null, StatusCodes.GONE);
        }
        await redis.setex(key, ttl, JSON.stringify(session));
        return ServiceResponse.failure(
          `Mã xác nhận không đúng. Bạn còn ${session.verifyAttemptsLeft} lần thử.`,
          { attemptsRemaining: session.verifyAttemptsLeft },
          StatusCodes.BAD_REQUEST,
        );
      }

      const dup = await userRepository.findByEmailAsync(session.email);
      if (dup) {
        await redis.del(key);
        return ServiceResponse.failure("Email đã được đăng ký.", null, StatusCodes.CONFLICT);
      }

      const user = await userRepository.createAsync({
        email: session.email,
        passwordHash: session.passwordHash,
        name: session.name,
        role: "customer",
        phone: session.phone,
      });
      await redis.del(key);

      const accessToken = signAccessToken({
        sub: user.id,
        email: user.email,
        role: "customer",
      });
      const refreshToken = signRefreshToken({
        sub: user.id,
        email: user.email,
        role: "customer",
      });
      const expiresInSeconds = getExpiresInSeconds(env.JWT_ACCESS_EXPIRES_IN);
      return ServiceResponse.success<TokenResponse>(
        "Đăng ký thành công.",
        {
          accessToken,
          refreshToken,
          expiresIn: expiresInSeconds,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: "customer",
          },
        },
        StatusCodes.CREATED,
      );
    } catch (ex) {
      logger.error(`Auth verifyRegistration error: ${(ex as Error).message}`);
      return ServiceResponse.failure("Đã xảy ra lỗi khi xác nhận mã.", null, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  },

  async refresh(refreshToken: string): Promise<ServiceResponse<TokenResponse | null>> {
    try {
      const decoded = jwt.verify(refreshToken, env.JWT_SECRET) as jwt.JwtPayload & {
        sub: string;
        email: string;
        role: UserRole;
        type: string;
      };
      if (decoded.type !== "refresh") {
        return ServiceResponse.failure("Invalid token type", null, StatusCodes.UNAUTHORIZED);
      }
      const user = await userRepository.findByIdAsync(decoded.sub);
      if (!user) {
        return ServiceResponse.failure("User not found", null, StatusCodes.UNAUTHORIZED);
      }
      const fullUser = await userRepository.findByEmailAsync(user.email);
      if (!fullUser || fullUser.status !== "active") {
        return ServiceResponse.failure("Account is not active", null, StatusCodes.FORBIDDEN);
      }
      const accessToken = signAccessToken({
        sub: fullUser.id,
        email: fullUser.email,
        role: fullUser.role as UserRole,
      });
      const newRefreshToken = signRefreshToken({
        sub: fullUser.id,
        email: fullUser.email,
        role: fullUser.role as UserRole,
      });
      const expiresInSeconds = getExpiresInSeconds(env.JWT_ACCESS_EXPIRES_IN);
      return ServiceResponse.success<TokenResponse>("Token refreshed", {
        accessToken,
        refreshToken: newRefreshToken,
        expiresIn: expiresInSeconds,
        user: {
          id: fullUser.id,
          email: fullUser.email,
          name: fullUser.name,
          role: fullUser.role as "owner" | "customer",
        },
      });
    } catch {
      return ServiceResponse.failure("Invalid or expired refresh token", null, StatusCodes.UNAUTHORIZED);
    }
  },
};
