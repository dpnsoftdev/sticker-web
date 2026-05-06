import { StatusCodes } from "http-status-codes";
import request from "supertest";

import type { User } from "@/api/user/userModel";
import type { ServiceResponse } from "@/common/models/serviceResponse";
import { app } from "@/index";

describe("User API Endpoints", () => {
  describe("GET /users", () => {
    it("should return a list of users", async () => {
      const response = await request(app).get("/users");
      const responseBody: ServiceResponse<User[]> = response.body;

      expect(response.statusCode).toEqual(StatusCodes.OK);
      expect(responseBody.success).toBeTruthy();
      expect(responseBody.message).toContain("Users found");
      expect(Array.isArray(responseBody.data)).toBe(true);
      if (responseBody.data.length > 0) {
        const u = responseBody.data[0];
        expect(u).toHaveProperty("id");
        expect(u).toHaveProperty("name");
        expect(u).toHaveProperty("email");
        expect(u).toHaveProperty("createdAt");
        expect(u).toHaveProperty("updatedAt");
      }
    });
  });

  describe("GET /users/:id", () => {
    it("should return a user for a valid UUID", async () => {
      const listRes = await request(app).get("/users");
      const listBody: ServiceResponse<User[]> = listRes.body;
      if (!listBody.data || listBody.data.length === 0) {
        return; // skip if no users
      }
      const testId = listBody.data[0].id;
      const response = await request(app).get(`/users/${testId}`);
      const responseBody: ServiceResponse<User> = response.body;

      expect(response.statusCode).toEqual(StatusCodes.OK);
      expect(responseBody.success).toBeTruthy();
      expect(responseBody.message).toContain("User found");
      if (!responseBody.data) throw new Error("expected user data");
      compareUsers(listBody.data[0], responseBody.data);
    });

    it("should return a not found error for non-existent ID", async () => {
      const testId = "00000000-0000-0000-0000-000000000000";

      const response = await request(app).get(`/users/${testId}`);
      const responseBody: ServiceResponse = response.body;

      expect(response.statusCode).toEqual(StatusCodes.NOT_FOUND);
      expect(responseBody.success).toBeFalsy();
      expect(responseBody.message).toContain("User not found");
      expect(responseBody.data).toBeNull();
    });

    it("should return a bad request for invalid ID format", async () => {
      const invalidInput = "not-a-uuid";
      const response = await request(app).get(`/users/${invalidInput}`);
      const responseBody: ServiceResponse = response.body;

      expect(response.statusCode).toEqual(StatusCodes.BAD_REQUEST);
      expect(responseBody.success).toBeFalsy();
      expect(responseBody.data).toBeNull();
    });
  });
});

function compareUsers(mockUser: User, responseUser: User) {
  if (!mockUser || !responseUser) {
    throw new Error("Invalid test data: mockUser or responseUser is undefined");
  }

  expect(responseUser.id).toEqual(mockUser.id);
  expect(responseUser.name).toEqual(mockUser.name);
  expect(responseUser.email).toEqual(mockUser.email);
  expect(new Date(responseUser.createdAt)).toEqual(mockUser.createdAt);
  expect(new Date(responseUser.updatedAt)).toEqual(mockUser.updatedAt);
}
