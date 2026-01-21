"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { NAV_ITEMS, ROLES } from "@/lib/constants";

// shadcn/ui
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

// icons
import { Menu, ShoppingBag, Moon, Sun, User, UserCircle2 } from "lucide-react";
import { SessionUser } from "@/types/user";

/**
 * Toggle dark mode đơn giản (không phụ thuộc next-themes).
 * Nếu project bạn đã có ThemeProvider/next-themes, bạn có thể thay bằng component theme toggle của bạn.
 */
function ThemeToggle() {
  const [isDark, setIsDark] = React.useState(false);

  React.useEffect(() => {
    const stored = localStorage.getItem("theme");
    const prefersDark =
      stored === "dark" ||
      (!stored && window.matchMedia?.("(prefers-color-scheme: dark)")?.matches);

    document.documentElement.classList.toggle("dark", prefersDark);
    setIsDark(prefersDark);
  }, []);

  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={toggle}
      aria-label="Toggle theme"
      className="rounded-full"
    >
      {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </Button>
  );
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col gap-1 md:flex-row md:items-center md:gap-7">
      {NAV_ITEMS.map((item) => {
        const active =
          pathname === item.href ||
          (item.href !== "/" && pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`nav-link ${active ? "text-primary" : ""}`}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}

function CartButton({ itemCount }: { itemCount: number }) {
  return (
    <Link href="/cart" className="relative">
      <Button variant="outline" size="icon" className="rounded-xl">
        <ShoppingBag className="h-5 w-5" />
      </Button>
      {itemCount > 0 && (
        <span className="absolute -right-2 -top-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-xs font-semibold text-white">
          {itemCount}
        </span>
      )}
    </Link>
  );
}

function AuthMenu({
  isAuthenticated,
  user,
}: {
  isAuthenticated: boolean;
  user: SessionUser | null;
}) {
  // -----------------------------
  // GUEST → icon redirect /login
  // -----------------------------
  if (!isAuthenticated) {
    return (
      <Link href="/login">
        <Button
          variant="outline"
          size="icon"
          className="rounded-xl"
          aria-label="Login"
        >
          <UserCircle2 className="h-5 w-5" />
        </Button>
      </Link>
    );
  }

  // -----------------------------
  // AUTHENTICATED → dropdown menu
  // -----------------------------
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          aria-label="Account menu"
        >
          <User className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-2">
          <p className="text-sm font-medium leading-none">
            {user?.name || user?.email || "Account"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {user?.role || "USER"}
          </p>
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link href="/user/profile">Profile</Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href="/user/orders">Orders</Link>
        </DropdownMenuItem>

        {user?.role === ROLES.ADMIN && (
          <DropdownMenuItem asChild>
            <Link href="/admin/dashboard">Admin</Link>
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => signOut()}
          className="text-red-600 focus:text-red-600"
        >
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function Header() {
  const { itemCount } = useCart();
  const { user, isAuthenticated } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background dark:bg-background">
      <div className="container mx-auto flex h-16 items-center gap-3 px-4">
        {/* Mobile menu */}
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>

            <SheetContent side="left" className="w-[300px] sm:w-[340px]">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <span aria-hidden>🍡</span>
                  <span className="font-semibold">Dango&apos;s Corner</span>
                </SheetTitle>
              </SheetHeader>

              <div className="mt-6">
                <NavLinks />
                <Separator className="my-4" />

                {/* Auth links on mobile */}
                {isAuthenticated ? (
                  <div className="flex flex-col gap-2">
                    <Button asChild variant="ghost" className="justify-start">
                      <Link href="/user/profile">Profile</Link>
                    </Button>
                    <Button asChild variant="ghost" className="justify-start">
                      <Link href="/user/orders">Orders</Link>
                    </Button>
                    {user?.role === ROLES.ADMIN && (
                      <Button asChild variant="ghost" className="justify-start">
                        <Link href="/admin/dashboard">Admin</Link>
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      className="justify-start text-red-600 hover:text-red-600"
                      onClick={() => signOut()}
                    >
                      Logout
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <Button asChild variant="outline" className="justify-start">
                      <Link href="/login">Login</Link>
                    </Button>
                    <Button asChild className="justify-start">
                      <Link href="/register">Register</Link>
                    </Button>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-lg" aria-hidden>
            🍡
          </span>
          <span className="text-lg font-semibold tracking-tight text-primary">
            Dango&apos;s Corner
          </span>
        </Link>

        {/* Center nav (desktop) */}
        <div className="hidden flex-1 justify-center md:flex">
          <nav className="flex items-center">
            <NavLinks />
          </nav>
        </div>

        {/* Right actions */}
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <CartButton itemCount={itemCount} />
          <AuthMenu isAuthenticated={isAuthenticated} user={user} />
        </div>
      </div>
    </header>
  );
}
