import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  MOCK_ADMIN_ACCOUNT,
  MOCK_CUSTOMER_ACCOUNT,
  USE_MOCK_DATA,
} from "@/lib/constants";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { authOrigin } from "@/lib/supabase/redirect";

export type UserRole = "customer" | "staff" | "admin";
export interface MockUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
}
export interface AuthResult {
  ok: boolean;
  message: string;
  needsConfirmation?: boolean;
}
interface AuthState {
  user: MockUser | null;
  initialized: boolean;
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<AuthResult>;
  register: (
    email: string,
    password: string,
    fullName: string,
  ) => Promise<AuthResult>;
  logout: () => Promise<AuthResult>;
}
const unavailable = {
  ok: false,
  message: "ไม่สามารถเชื่อมต่อระบบยืนยันตัวตนได้ กรุณาลองใหม่",
};
let authRevision = 0;
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      initialized: USE_MOCK_DATA,
      initialize: async () => {
        if (USE_MOCK_DATA) {
          set({ initialized: true });
          return;
        }
        const revision = ++authRevision;
        try {
          const client = createSupabaseBrowserClient();
          if (!client) {
            set({ user: null, initialized: true });
            return;
          }
          const { data, error } = await client.auth.getUser();
          if (revision !== authRevision) return;
          if (error || !data.user) {
            set({ user: null, initialized: true });
            return;
          }
          const { data: profile } = await client
            .from("profiles")
            .select("full_name,role")
            .eq("id", data.user.id)
            .maybeSingle();
          if (revision !== authRevision) return;
          const role: UserRole =
            profile?.role === "admin" || profile?.role === "staff"
              ? profile.role
              : "customer";
          set({
            user: {
              id: data.user.id,
              email: data.user.email ?? "",
              fullName:
                profile?.full_name ?? data.user.user_metadata?.full_name ?? "",
              role,
            },
            initialized: true,
          });
        } catch {
          if (revision === authRevision) set({ user: null, initialized: true });
        }
      },
      login: async (email, password) => {
        if (USE_MOCK_DATA) {
          const admin =
            email === MOCK_ADMIN_ACCOUNT.email &&
            password === MOCK_ADMIN_ACCOUNT.password;
          const customer =
            email === MOCK_CUSTOMER_ACCOUNT.email &&
            password === MOCK_CUSTOMER_ACCOUNT.password;
          if (!admin && !customer)
            return { ok: false, message: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" };
          set({
            user: {
              id: admin ? "admin-1" : "customer-1",
              email,
              fullName: admin ? "ผู้ดูแลระบบ" : "ลูกค้าทดสอบ",
              role: admin ? "admin" : "customer",
            },
          });
          return { ok: true, message: "เข้าสู่ระบบสำเร็จ" };
        }
        try {
          const client = createSupabaseBrowserClient();
          if (!client) return unavailable;
          const { error } = await client.auth.signInWithPassword({
            email,
            password,
          });
          if (error)
            return {
              ok: false,
              message: "อีเมลหรือรหัสผ่านไม่ถูกต้อง หรือยังไม่ได้ยืนยันอีเมล",
            };
          await get().initialize();
          return get().user
            ? { ok: true, message: "เข้าสู่ระบบสำเร็จ" }
            : unavailable;
        } catch {
          return unavailable;
        }
      },
      register: async (email, password, fullName) => {
        if (USE_MOCK_DATA) {
          set({
            user: {
              id: `user-${Date.now()}`,
              email,
              fullName,
              role: "customer",
            },
          });
          return { ok: true, message: "สมัครสมาชิกสำเร็จ" };
        }
        try {
          const client = createSupabaseBrowserClient();
          if (!client) return unavailable;
          const origin = authOrigin(window.location.origin);
          const { data, error } = await client.auth.signUp({
            email,
            password,
            options: {
              data: { full_name: fullName },
              emailRedirectTo: `${origin.replace(/\/$/, "")}/api/auth/callback`,
            },
          });
          if (error) {
            const message = error.code === "user_already_exists" || error.code === "email_exists"
              ? "อีเมลนี้มีบัญชีแล้ว กรุณาเข้าสู่ระบบ"
              : error.code === "weak_password"
                ? "รหัสผ่านไม่ปลอดภัยพอ กรุณาเลือกรหัสผ่านใหม่"
                : "สมัครสมาชิกไม่สำเร็จ กรุณาลองใหม่";
            return { ok: false, message };
          }
          if (!data.session) {
            set({ user: null });
            return {
              ok: true,
              message: "สมัครสมาชิกสำเร็จ กรุณายืนยันอีเมลก่อนเข้าสู่ระบบ",
              needsConfirmation: true,
            };
          }
          await get().initialize();
          return { ok: true, message: "สมัครสมาชิกสำเร็จ" };
        } catch {
          return unavailable;
        }
      },
      logout: async () => {
        if (!USE_MOCK_DATA) {
          try {
            const client = createSupabaseBrowserClient();
            if (!client) return unavailable;
            const { error } = await client.auth.signOut();
            if (error) return unavailable;
          } catch {
            return unavailable;
          }
        }
        authRevision++;
        set({ user: null, initialized: true });
        return { ok: true, message: "ออกจากระบบแล้ว" };
      },
    }),
    {
      name: "spinshop360-auth",
      partialize: (state) => ({ user: USE_MOCK_DATA ? state.user : null }),
      // A local mock admin session must never become a real identity.
      merge: (persisted, current) =>
        USE_MOCK_DATA
          ? { ...current, ...(persisted as { user?: MockUser | null }) }
          : { ...current, user: null },
    },
  ),
);
