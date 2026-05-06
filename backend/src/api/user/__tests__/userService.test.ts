import { StatusCodes } from "http-status-codes";
import type { Mock } from "vitest";

import type { User } from "@/api/user/userModel";
import { UserRepository } from "@/api/user/userRepository";
import { UserService } from "@/api/user/userService";

vi.mock("@/api/user/userRepository");

describe("userService", () => {
  let userServiceInstance: UserService;
  let userRepositoryInstance: UserRepository;

  const mockUsers: User[] = [
    {
      id: "00000000-0000-4000-8000-000000000001",
      name: "Alice",
      email: "alice@example.com",
      phone: null,
      avatar: null,
      emailVerified: true,
      phoneVerified: false,
      role: "customer",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "00000000-0000-4000-8000-000000000002",
      name: "Bob",
      email: "bob@example.com",
      phone: null,
      avatar: null,
      emailVerified: false,
      phoneVerified: false,
      role: "customer",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  beforeEach(() => {
    userRepositoryInstance = new UserRepository();
    userServiceInstance = new UserService(userRepositoryInstance);
  });

  describe("findAll", () => {
    it("return all users", async () => {
      // Arrange
      (userRepositoryInstance.findAllAsync as Mock).mockReturnValue(mockUsers);

      // Act
      const result = await userServiceInstance.findAll();

      // Assert
      expect(result.statusCode).toEqual(StatusCodes.OK);
      expect(result.success).toBeTruthy();
      expect(result.message).equals("Users found");
      expect(result.data).toEqual(mockUsers);
    });

    it("returns a not found error for no users found", async () => {
      // Arrange
      (userRepositoryInstance.findAllAsync as Mock).mockReturnValue(null);

      // Act
      const result = await userServiceInstance.findAll();

      // Assert
      expect(result.statusCode).toEqual(StatusCodes.NOT_FOUND);
      expect(result.success).toBeFalsy();
      expect(result.message).equals("No Users found");
      expect(result.data).toBeNull();
    });

    it("handles errors for findAllAsync", async () => {
      // Arrange
      (userRepositoryInstance.findAllAsync as Mock).mockRejectedValue(new Error("Database error"));

      // Act
      const result = await userServiceInstance.findAll();

      // Assert
      expect(result.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
      expect(result.success).toBeFalsy();
      expect(result.message).equals("An error occurred while retrieving users.");
      expect(result.data).toBeNull();
    });
  });

  describe("findById", () => {
    it("returns a user for a valid ID", async () => {
      // Arrange
      const testId = "00000000-0000-4000-8000-000000000001";
      const mockUser = mockUsers.find((user) => user.id === testId);
      (userRepositoryInstance.findByIdAsync as Mock).mockReturnValue(mockUser);

      // Act
      const result = await userServiceInstance.findById(testId);

      // Assert
      expect(result.statusCode).toEqual(StatusCodes.OK);
      expect(result.success).toBeTruthy();
      expect(result.message).equals("User found");
      expect(result.data).toEqual(mockUser);
    });

    it("handles errors for findByIdAsync", async () => {
      // Arrange
      const testId = "00000000-0000-4000-8000-000000000001";
      (userRepositoryInstance.findByIdAsync as Mock).mockRejectedValue(new Error("Database error"));

      // Act
      const result = await userServiceInstance.findById(testId);

      // Assert
      expect(result.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
      expect(result.success).toBeFalsy();
      expect(result.message).equals("An error occurred while finding user.");
      expect(result.data).toBeNull();
    });

    it("returns a not found error for non-existent ID", async () => {
      // Arrange
      const testId = "00000000-0000-4000-8000-000000000099";
      (userRepositoryInstance.findByIdAsync as Mock).mockReturnValue(null);

      // Act
      const result = await userServiceInstance.findById(testId);

      // Assert
      expect(result.statusCode).toEqual(StatusCodes.NOT_FOUND);
      expect(result.success).toBeFalsy();
      expect(result.message).equals("User not found");
      expect(result.data).toBeNull();
    });
  });
});
