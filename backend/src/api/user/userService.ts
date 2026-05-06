import bcrypt from "bcryptjs";
import { StatusCodes } from "http-status-codes";

import type { ChangePasswordBody, UpdateProfileBody } from "@/api/auth/authModel";
import type { User } from "@/api/user/userModel";
import { UserRepository } from "@/api/user/userRepository";
import { ServiceResponse } from "@/common/models/serviceResponse";
import { logger } from "@/index";

const PASSWORD_SALT_ROUNDS = 10;

export class UserService {
  private userRepository: UserRepository;

  constructor(repository: UserRepository = new UserRepository()) {
    this.userRepository = repository;
  }

  // Retrieves all users from the database
  async findAll(): Promise<ServiceResponse<User[] | null>> {
    try {
      const users = await this.userRepository.findAllAsync();
      if (!users || users.length === 0) {
        return ServiceResponse.failure("No Users found", null, StatusCodes.NOT_FOUND);
      }
      return ServiceResponse.success<User[]>("Users found", users);
    } catch (ex) {
      const errorMessage = `Error finding all users: $${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        "An error occurred while retrieving users.",
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Retrieves a single user by their ID
  async findById(id: string): Promise<ServiceResponse<User | null>> {
    try {
      const user = await this.userRepository.findByIdAsync(id);
      if (!user) {
        return ServiceResponse.failure("User not found", null, StatusCodes.NOT_FOUND);
      }
      return ServiceResponse.success<User>("User found", user);
    } catch (ex) {
      const errorMessage = `Error finding user with id ${id}: ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure("An error occurred while finding user.", null, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  async updateProfile(id: string, body: UpdateProfileBody): Promise<ServiceResponse<User | null>> {
    try {
      const name = body.name !== undefined ? body.name.trim() : undefined;
      const phone = body.phone === undefined ? undefined : body.phone === "" ? null : body.phone.trim();

      if (name === undefined && phone === undefined) {
        return ServiceResponse.failure("No fields to update", null, StatusCodes.BAD_REQUEST);
      }

      const updated = await this.userRepository.updateProfileAsync(id, {
        ...(name !== undefined ? { name } : {}),
        ...(phone !== undefined ? { phone } : {}),
      });
      if (!updated) {
        return ServiceResponse.failure("User not found", null, StatusCodes.NOT_FOUND);
      }
      return ServiceResponse.success<User>("Profile updated", updated);
    } catch (ex) {
      logger.error(`updateProfile: ${(ex as Error).message}`);
      return ServiceResponse.failure("Could not update profile", null, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  async changePassword(id: string, body: ChangePasswordBody): Promise<ServiceResponse<null>> {
    try {
      const user = await this.userRepository.findByIdWithPasswordAsync(id);
      if (!user) {
        return ServiceResponse.failure("User not found", null, StatusCodes.NOT_FOUND);
      }
      const valid = await bcrypt.compare(body.currentPassword, user.passwordHash);
      if (!valid) {
        return ServiceResponse.failure("Mật khẩu hiện tại không đúng", null, StatusCodes.UNAUTHORIZED);
      }
      const passwordHash = await bcrypt.hash(body.newPassword, PASSWORD_SALT_ROUNDS);
      await this.userRepository.updatePasswordHash(id, passwordHash);
      return ServiceResponse.success<null>("Password updated", null);
    } catch (ex) {
      logger.error(`changePassword: ${(ex as Error).message}`);
      return ServiceResponse.failure("Could not change password", null, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }
}

export const userService = new UserService();
