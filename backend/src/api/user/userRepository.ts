import type { User } from "@/api/user/userModel";
import { prisma } from "@/common/db/postgres/client";
import type { User as PrismaUser } from "@prisma/client";

export class UserRepository {
  async findAllAsync(): Promise<User[]> {
    const users = await prisma.user.findMany({
      orderBy: {
        id: "asc",
      },
    });
    // Prisma automatically maps snake_case to camelCase based on schema
    return users.map((user: PrismaUser) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      age: user.age,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }));
  }

  async findByIdAsync(id: number): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: { id },
    });
    if (!user) {
      return null;
    }
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      age: user.age,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
