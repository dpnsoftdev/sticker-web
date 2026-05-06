"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { profileApi } from "@/features/profile/profile.api";
import { getAuthErrorMessage } from "@/features/auth/auth.service";
import { ROUTES } from "@/lib/constants";
import {
  normalizeVietnamPhone,
  validateDisplayName,
  validatePasswordChangeInput,
  validateVietnamPhoneOptional,
} from "@/lib/validation";
import { useAuth } from "@/hooks/useAuth";

export default function UserProfilePage() {
  const { update } = useSession();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [emailReadonly, setEmailReadonly] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [memberSince, setMemberSince] = useState<string | null>(null);

  const [savingProfile, setSavingProfile] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  const loadProfile = useCallback(async () => {
    setLoadError(null);
    const p = await profileApi.getMe();
    setName(p.name);
    setPhone(p.phone ?? "");
    setEmailReadonly(p.email);
    setEmailVerified(p.emailVerified);
    setPhoneVerified(p.phoneVerified);
    setMemberSince(
      new Date(p.createdAt).toLocaleDateString("vi-VN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    );
  }, []);

  useEffect(() => {
    if (!isAuthenticated || authLoading) return;

    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        await loadProfile();
      } catch (e) {
        if (!cancelled) setLoadError(getAuthErrorMessage(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, authLoading, loadProfile]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const nameCheck = validateDisplayName(name);
    if (!nameCheck.ok) {
      toast.error(nameCheck.message);
      return;
    }
    const phoneCheck = validateVietnamPhoneOptional(phone);
    if (!phoneCheck.ok) {
      toast.error(phoneCheck.message);
      return;
    }
    const trimmedName = name.trim();
    const phoneTrim = phone.trim();
    const phonePayload =
      phoneTrim === "" ? "" : normalizeVietnamPhone(phoneTrim);

    setSavingProfile(true);
    try {
      const updated = await profileApi.updateProfile({
        name: trimmedName,
        phone: phonePayload,
      });
      setName(updated.name);
      setPhone(updated.phone ?? "");
      toast.success("Đã cập nhật hồ sơ.");
      await update({ user: { name: updated.name } });
    } catch (err) {
      toast.error(getAuthErrorMessage(err));
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const pwdCheck = validatePasswordChangeInput({
      currentPassword,
      newPassword,
      confirmPassword,
    });
    if (!pwdCheck.ok) {
      toast.error(pwdCheck.message);
      return;
    }
    setSavingPassword(true);
    try {
      await profileApi.changePassword({
        currentPassword,
        newPassword,
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Đã đổi mật khẩu.");
    } catch (err) {
      toast.error(getAuthErrorMessage(err));
    } finally {
      setSavingPassword(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-10">
        <p className="text-muted-foreground">Đang tải…</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-10">
        <p className="text-destructive">{loadError}</p>
        <Button variant="outline" className="mt-4" asChild>
          <Link href={ROUTES.HOME}>Về trang chủ</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-background">
      <div className="container mx-auto max-w-2xl px-4 py-6 md:py-10">
        <Link
          href={ROUTES.HOME}
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          ← Về cửa hàng
        </Link>

        <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          Tài khoản
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Quản lý thông tin cá nhân và bảo mật đăng nhập.
        </p>

        <div className="mt-8 space-y-8">
          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-bold text-foreground">
              Thông tin cá nhân
            </h2>
            <form onSubmit={handleSaveProfile} className="mt-4 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Email
                </label>
                <Input value={emailReadonly} disabled className="bg-muted/50" />
                <p className="mt-1 text-xs text-muted-foreground">
                  {emailVerified ? "Đã xác minh email" : "Chưa xác minh email"}
                </p>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Họ và tên <span className="text-destructive">*</span>
                </label>
                <Input
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Họ và tên"
                  autoComplete="name"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Số điện thoại
                </label>
                <Input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="Để trống nếu chưa có"
                  autoComplete="tel"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  {phoneVerified ? "Đã xác minh SĐT" : "Chưa xác minh SĐT"}
                </p>
              </div>

              {memberSince ? (
                <p className="text-xs text-muted-foreground">
                  Tham gia: {memberSince}
                </p>
              ) : null}

              <Button type="submit" disabled={savingProfile}>
                {savingProfile ? "Đang lưu…" : "Lưu thay đổi"}
              </Button>
            </form>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-bold text-foreground">Đổi mật khẩu</h2>
            <form onSubmit={handleChangePassword} className="mt-4 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Mật khẩu hiện tại <span className="text-destructive">*</span>
                </label>
                <Input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Mật khẩu mới <span className="text-destructive">*</span>
                </label>
                <Input
                  type="password"
                  required
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                  minLength={8}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Nhập lại mật khẩu mới{" "}
                  <span className="text-destructive">*</span>
                </label>
                <Input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  minLength={8}
                />
              </div>
              <Button
                type="submit"
                variant="secondary"
                disabled={savingPassword}
              >
                {savingPassword ? "Đang cập nhật…" : "Đổi mật khẩu"}
              </Button>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
