"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

import { useAuth } from "@/hooks/useAuth";
import { NAV_ITEMS, ROLES, ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";

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
import {
  Menu,
  ShoppingBag,
  Moon,
  Sun,
  User,
  UserCircle2,
  LogIn,
  UserPlus,
  Package,
  LayoutDashboard,
  LogOut,
} from "lucide-react";
import { SessionUser } from "@/types/user";
import { HeaderNotification } from "./HeaderNotification";
import { CartDrawer } from "@/components/common/CartDrawer";
import { useCartStore } from "@/stores/cart.store";
import { AuthModal, type AuthView } from "@/components/common/AuthModal";

const HOVER_MENU_CLOSE_MS = 150;
const LOGO_HEIGHT = 60;
const LOGO_WIDTH = Math.round(LOGO_HEIGHT * (16 / 9));

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
      {NAV_ITEMS.map(item => {
        const disabled = item.status === "disabled";
        const active =
          !disabled &&
          (pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href)));

        if (disabled) {
          return (
            <span
              key={item.href}
              className={cn(
                "inline-block text-sm font-medium",
                "cursor-not-allowed select-none pointer-events-none",
                "text-muted-foreground/80 opacity-70"
              )}
              aria-disabled="true"
            >
              {item.label}
            </span>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn("nav-link", active && "text-primary-bold")}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}

export function CartButton() {
  const itemCount = useCartStore(state => state.getItemCount());
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <CartDrawer
      onCheckout={() => {}}
      trigger={
        <Button variant="ghost" size="icon" className="rounded-full relative">
          <ShoppingBag className="h-5 w-5" />
          {mounted && itemCount > 0 && (
            <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-xs font-semibold text-primary-foreground">
              {itemCount}
            </span>
          )}
        </Button>
      }
    />
  );
}

function AuthMenu({
  isAuthenticated,
  user,
  onOpenAuth,
}: {
  isAuthenticated: boolean;
  user: SessionUser | null;
  onOpenAuth: (start?: AuthView) => void;
}) {
  const [accountMenuOpen, setAccountMenuOpen] = React.useState(false);
  const hoverCloseTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  React.useEffect(() => {
    return () => {
      if (hoverCloseTimerRef.current) {
        clearTimeout(hoverCloseTimerRef.current);
      }
    };
  }, []);

  const cancelScheduledClose = React.useCallback(() => {
    if (hoverCloseTimerRef.current) {
      clearTimeout(hoverCloseTimerRef.current);
      hoverCloseTimerRef.current = null;
    }
  }, []);

  const openAccountMenu = React.useCallback(
    (e: React.PointerEvent) => {
      // Touch uses tap + Radix controlled open; hover enter/leave would fire
      // around a tap and schedule a close right after open (mobile bug).
      if (e.pointerType === "touch") return;
      cancelScheduledClose();
      setAccountMenuOpen(true);
    },
    [cancelScheduledClose]
  );

  const scheduleCloseAccountMenu = React.useCallback(
    (e: React.PointerEvent) => {
      if (e.pointerType === "touch") return;
      cancelScheduledClose();
      hoverCloseTimerRef.current = setTimeout(() => {
        setAccountMenuOpen(false);
        hoverCloseTimerRef.current = null;
      }, HOVER_MENU_CLOSE_MS);
    },
    [cancelScheduledClose]
  );

  // -----------------------------
  // GUEST → open sign-in / register modal
  // -----------------------------
  if (!isAuthenticated) {
    return (
      <Button
        type="button"
        variant="outline"
        size="icon"
        className={cn(
          "rounded-xl",
          "max-md:border-primary/20 max-md:bg-background/90 max-md:shadow-sm max-md:ring-1 max-md:ring-border/50",
          "md:shadow-none md:ring-0"
        )}
        aria-label="Đăng nhập hoặc đăng ký"
        onClick={() => onOpenAuth("signin")}
      >
        <UserCircle2 className="h-5 w-5" />
      </Button>
    );
  }

  // -----------------------------
  // AUTHENTICATED → dropdown (hover icon or click)
  // -----------------------------
  return (
    <DropdownMenu
      open={accountMenuOpen}
      onOpenChange={setAccountMenuOpen}
      modal={false}
    >
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "rounded-full",
            "max-md:bg-muted/50 max-md:ring-1 max-md:ring-border/55 md:bg-transparent md:ring-0"
          )}
          aria-label="Menu tài khoản"
          aria-expanded={accountMenuOpen}
          onPointerEnter={openAccountMenu}
          onPointerLeave={scheduleCloseAccountMenu}
        >
          <User className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-56 outline-none border-none"
        onPointerEnter={openAccountMenu}
        onPointerLeave={scheduleCloseAccountMenu}
        onCloseAutoFocus={e => e.preventDefault()}
      >
        <div className="px-2 py-2">
          <p className="text-sm font-medium leading-none">
            {user?.name || user?.email || "Account"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {user?.role || "USER"}
          </p>
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild className="cursor-pointer">
          <Link href="/user/profile">Tài khoản</Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild className="cursor-pointer">
          <Link href={ROUTES.MY_ORDERS}>Đơn hàng</Link>
        </DropdownMenuItem>

        {user?.role === ROLES.ADMIN && (
          <DropdownMenuItem asChild className="cursor-pointer">
            <Link href="/admin/dashboard">Admin</Link>
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => signOut()}
          className="cursor-pointer text-red-600 focus:text-red-600"
        >
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function LogoImage() {
  return (
    <Link href="/" className="flex items-center">
      <span
        className="relative block shrink-0"
        style={{ width: LOGO_WIDTH, height: LOGO_HEIGHT }}
      >
        <Image
          src="/dango_logo.png"
          alt="Dango's Corner"
          fill
          className="object-contain"
          sizes={`${LOGO_WIDTH}px`}
        />
      </span>
    </Link>
  );
}

export function Header() {
  const { user, isAuthenticated } = useAuth();
  const [mounted, setMounted] = React.useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [authOpenSeq, setAuthOpenSeq] = React.useState(0);
  const [authDialog, setAuthDialog] = React.useState<{
    open: boolean;
    start: AuthView;
  }>({ open: false, start: "signin" });

  const openAuthModal = React.useCallback((start: AuthView = "signin") => {
    setAuthOpenSeq(n => n + 1);
    setAuthDialog({ open: true, start });
    setMobileMenuOpen(false);
  }, []);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Defer Radix (Sheet/Dialog) until after mount to avoid server/client ID mismatch
  if (!mounted) {
    return (
      <>
        <header className="sticky top-0 z-50 w-full bg-background dark:bg-background">
          <div className="container mx-auto flex h-16 items-center gap-3 px-4">
            <div className="md:hidden">
              <span
                className="inline-flex h-10 w-10 items-center justify-center rounded-full"
                aria-hidden
              >
                <Menu className="h-5 w-5" />
              </span>
            </div>
            <LogoImage />
            <div className="hidden flex-1 justify-center md:flex">
              <nav className="flex items-center">
                <NavLinks />
              </nav>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <span className="h-10 w-10 rounded-full" aria-hidden />
              <span className="h-10 w-10 rounded-full" aria-hidden />
              <span className="h-10 w-10 rounded-full" aria-hidden />
            </div>
          </div>
        </header>
        <HeaderNotification />
      </>
    );
  }

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-background dark:bg-background">
        <div className="container mx-auto flex h-16 items-center gap-3 px-4">
          {/* Mobile menu */}
          <div className="md:hidden">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>

              <SheetContent
                side="left"
                className="flex w-[min(100vw-2rem,320px)] flex-col border-border/60 bg-background/95 backdrop-blur-md sm:w-[340px]"
              >
                <SheetHeader className="space-y-1 border-b border-border/50 pb-4 text-left">
                  <SheetTitle className="text-lg font-semibold tracking-tight">
                    Menu
                  </SheetTitle>
                  <p className="text-sm font-normal text-muted-foreground">
                    Dango&apos;s Corner
                  </p>
                </SheetHeader>

                <div className="mt-6 flex min-h-0 flex-1 flex-col gap-0">
                  <NavLinks onNavigate={() => setMobileMenuOpen(false)} />
                  <Separator className="my-5 bg-border/60" />

                  {isAuthenticated ? (
                    <>
                      <div className="mb-4 rounded-xl border border-border/60 bg-muted/35 p-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/15 text-base font-semibold text-primary"
                            aria-hidden
                          >
                            {(
                              user?.name?.trim()?.[0] ||
                              user?.email?.trim()?.[0] ||
                              "?"
                            ).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold leading-tight">
                              {user?.name?.trim() ||
                                user?.email?.split("@")[0] ||
                                "Tài khoản"}
                            </p>
                            <p className="mt-0.5 truncate text-xs text-muted-foreground">
                              {user?.email || user?.role || ""}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1">
                        <Button
                          asChild
                          variant="ghost"
                          className="h-11 justify-start gap-3 px-3 font-normal"
                        >
                          <Link
                            href="/user/profile"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <User className="h-4 w-4 shrink-0 text-muted-foreground" />
                            Tài khoản
                          </Link>
                        </Button>
                        <Button
                          asChild
                          variant="ghost"
                          className="h-11 justify-start gap-3 px-3 font-normal"
                        >
                          <Link
                            href={ROUTES.MY_ORDERS}
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <Package className="h-4 w-4 shrink-0 text-muted-foreground" />
                            Đơn hàng
                          </Link>
                        </Button>
                        {user?.role === ROLES.ADMIN && (
                          <Button
                            asChild
                            variant="ghost"
                            className="h-11 justify-start gap-3 px-3 font-normal"
                          >
                            <Link
                              href="/admin/dashboard"
                              onClick={() => setMobileMenuOpen(false)}
                            >
                              <LayoutDashboard className="h-4 w-4 shrink-0 text-muted-foreground" />
                              Quản trị
                            </Link>
                          </Button>
                        )}
                        <Separator className="my-3 bg-border/50" />
                        <Button
                          variant="ghost"
                          className="h-11 justify-start gap-3 px-3 font-normal text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => {
                            setMobileMenuOpen(false);
                            void signOut();
                          }}
                        >
                          <LogOut className="h-4 w-4 shrink-0" />
                          Đăng xuất
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <Button
                        type="button"
                        variant="default"
                        className="h-11 justify-start gap-3 px-4 shadow-sm"
                        onClick={() => openAuthModal("signin")}
                      >
                        <LogIn className="h-4 w-4 shrink-0" />
                        Đăng nhập
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="h-11 justify-start gap-3 border-border/80 bg-background px-4"
                        onClick={() => openAuthModal("register")}
                      >
                        <UserPlus className="h-4 w-4 shrink-0" />
                        Tạo tài khoản
                      </Button>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Logo */}
          <LogoImage />

          {/* Center nav (desktop) */}
          <div className="hidden flex-1 justify-center md:flex">
            <nav className="flex items-center">
              <NavLinks />
            </nav>
          </div>

          {/* Right actions */}
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <CartButton />
            <AuthMenu
              isAuthenticated={isAuthenticated}
              user={user}
              onOpenAuth={openAuthModal}
            />
          </div>
        </div>
      </header>

      <AuthModal
        open={authDialog.open}
        onOpenChange={open => setAuthDialog(s => ({ ...s, open }))}
        startWith={authDialog.start}
        openSession={authOpenSeq}
      />

      <HeaderNotification />
    </>
  );
}
