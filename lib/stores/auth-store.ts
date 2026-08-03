import { create } from "zustand";
import { persist } from "zustand/middleware";
import { MOCK_ADMIN_ACCOUNT, MOCK_CUSTOMER_ACCOUNT } from "@/lib/constants";

export type UserRole = "customer" | "staff" | "admin";

export interface MockUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
}

interface AuthState {
  user: MockUser | null;
  login: (email: string, password: string) => { ok: boolean; message: string };
  register: (email: string, password: string, fullName: string) => { ok: boolean; message: string };
  logout: () => void;
}

/**
 * Mock Mode authentication. Sessions and passwords are NOT secure and exist
 * only to demonstrate UI flows without wiring Supabase Auth. In Supabase
 * mode, replace with `supabase.auth.signInWithPassword` /
 * `supabase.auth.signUp` and read the session from Supabase, not localStorage.
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      login: (email, password) => {
        if (email === MOCK_ADMIN_ACCOUNT.email && password === MOCK_ADMIN_ACCOUNT.password) {
          set({ user: { id: "admin-1", email, fullName: "ผู้ดูแลระบบ", role: "admin" } });
          return { ok: true, message: "เข้าสู่ระบบสำเร็จ" };
        }
        if (email === MOCK_CUSTOMER_ACCOUNT.email && password === MOCK_CUSTOMER_ACCOUNT.password) {
          set({ user: { id: "customer-1", email, fullName: "ลูกค้าทดสอบ", role: "customer" } });
          return { ok: true, message: "เข้าสู่ระบบสำเร็จ" };
        }
        return { ok: false, message: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" };
      },
      register: (email, _password, fullName) => {
        set({ user: { id: `user-${Date.now()}`, email, fullName, role: "customer" } });
        return { ok: true, message: "สมัครสมาชิกสำเร็จ" };
      },
      logout: () => set({ user: null }),
    }),
    { name: "spinshop360-auth" }
  )
);
