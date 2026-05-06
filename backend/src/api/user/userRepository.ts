import type { User } from "@/api/user/userModel";
import { prisma } from "@/common/databases/postgres/client";
import type { User as PrismaUser } from "@/common/lib/prisma-client";

export interface UserWithPassword extends User {
  passwordHash: string;
  status: string;
}

function mapToUser(user: PrismaUser): User {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    avatar: user.avatar,
    emailVerified: user.emailVerified,
    phoneVerified: user.phoneVerified,
    role: user.role as User["role"],
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export class UserRepository {
  async findAllAsync(): Promise<User[]> {
    const users = await prisma.user.findMany({
      orderBy: {
        id: "asc",
      },
    });
    return users.map(mapToUser);
  }

  async findByIdAsync(id: string): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: { id },
    });
    if (!user) {
      return null;
    }
    return mapToUser(user);
  }

  async findByIdWithPasswordAsync(id: string): Promise<UserWithPassword | null> {
    const user = await prisma.user.findUnique({
      where: { id },
    });
    if (!user) {
      return null;
    }
    return {
      ...mapToUser(user),
      passwordHash: user.passwordHash,
      status: user.status,
    };
  }

  async findByEmailAsync(email: string): Promise<UserWithPassword | null> {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (!user) {
      return null;
    }
    return {
      ...mapToUser(user),
      passwordHash: user.passwordHash,
      status: user.status,
    };
  }

  async createAsync(data: {
    email: string;
    passwordHash: string;
    name: string;
    role?: "owner" | "customer";
    phone?: string | null;
  }): Promise<User> {
    const user = await prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        passwordHash: data.passwordHash,
        name: data.name,
        role: data.role ?? "customer",
        ...(data.phone != null && data.phone !== "" ? { phone: data.phone } : {}),
      },
    });
    return mapToUser(user);
  }

  async updateProfileAsync(id: string, data: { name?: string; phone?: string | null }): Promise<User | null> {
    try {
      const user = await prisma.user.update({
        where: { id },
        data: {
          ...(data.name !== undefined ? { name: data.name } : {}),
          ...(data.phone !== undefined ? { phone: data.phone } : {}),
        },
      });
      return mapToUser(user);
    } catch {
      return null;
    }
  }

  async updatePasswordHash(id: string, passwordHash: string): Promise<void> {
    await prisma.user.update({
      where: { id },
      data: { passwordHash },
    });
  }

  async updateLastLoginAt(id: string): Promise<void> {
    await prisma.user.update({
      where: { id },
      data: { lastLoginAt: new Date() },
    });
  }
}
