"use client";

import Link from "next/link";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { signOut } from "next-auth/react";
import { ROLES } from "@/lib/constants";

export function Header() {
  const { itemCount } = useCart();
  const { user, isAuthenticated } = useAuth();

  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold">
          Sticker Store
        </Link>
        <nav className="flex items-center gap-6">
          <Link href="/products">Products</Link>
          <Link href="/cart" className="relative">
            Cart
            {itemCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {itemCount}
              </span>
            )}
          </Link>
          {isAuthenticated ? (
            <>
              <Link href="/user/profile">Profile</Link>
              <Link href="/user/orders">Orders</Link>
              {user?.role === ROLES.ADMIN && <Link href="/admin/dashboard">Admin</Link>}
              <button onClick={() => signOut()}>Logout</button>
            </>
          ) : (
            <>
              <Link href="/login">Login</Link>
              <Link href="/register">Register</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
