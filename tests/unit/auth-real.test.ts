import { beforeEach, describe, expect, it, vi } from "vitest";
const { auth, profile } = vi.hoisted(() => ({
  auth: {
    getUser: vi.fn(),
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
  },
  profile: vi.fn(),
}));
vi.mock("@/lib/constants", () => ({ USE_MOCK_DATA: false }));
vi.mock("@/lib/supabase/client", () => ({
  createSupabaseBrowserClient: () => ({
    auth,
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: profile }) }) }),
  }),
}));
import { useAuthStore } from "@/lib/stores/auth-store";
const user = {
  id: "real",
  email: "customer@example.com",
  user_metadata: { role: "admin", full_name: "Customer" },
};
beforeEach(() => {
  vi.clearAllMocks();
  useAuthStore.setState({ user: null });
  auth.getUser.mockResolvedValue({ data: { user }, error: null });
  profile.mockResolvedValue({
    data: { full_name: "Customer", role: "customer" },
    error: null,
  });
});
describe("real auth", () => {
  it("initializes only a verified session and reads role from profiles", async () => {
    await useAuthStore.getState().initialize();
    expect(useAuthStore.getState().user).toMatchObject({
      id: "real",
      role: "customer",
    });
  });
  it("never elevates role using editable user metadata", async () => {
    profile.mockResolvedValue({ data: null, error: null });
    await useAuthStore.getState().initialize();
    expect(useAuthStore.getState().user?.role).toBe("customer");
  });
  it("does not hydrate forged mock users from old localStorage", async () => {
    localStorage.setItem(
      "spinshop360-auth",
      JSON.stringify({
        state: { user: { id: "admin-1", role: "admin" } },
        version: 0,
      }),
    );
    await useAuthStore.persist.rehydrate();
    expect(useAuthStore.getState().user).toBeNull();
  });
  it("leaves user signed out when email confirmation is required", async () => {
    auth.signUp.mockResolvedValue({
      data: { session: null, user },
      error: null,
    });
    const result = await useAuthStore
      .getState()
      .register("customer@example.com", "password123", "Customer");
    expect(result).toMatchObject({ ok: true, needsConfirmation: true });
    expect(useAuthStore.getState().user).toBeNull();
  });
  it("calls Supabase signout and clears the session", async () => {
    auth.signOut.mockResolvedValue({ error: null });
    useAuthStore.setState({
      user: {
        id: "real",
        email: user.email,
        fullName: "Customer",
        role: "customer",
      },
    });
    await useAuthStore.getState().logout();
    expect(auth.signOut).toHaveBeenCalled();
    expect(useAuthStore.getState().user).toBeNull();
  });
  it("clears UI identity when session verification fails",async()=>{
    auth.getUser.mockResolvedValue({data:{user:null},error:{message:"expired"}});
    useAuthStore.setState({user:{id:"real",email:user.email,fullName:"Customer",role:"admin"}});
    await useAuthStore.getState().initialize();expect(useAuthStore.getState().user).toBeNull();
  });
  it("keeps the current session visible when remote signout fails",async()=>{
    auth.signOut.mockResolvedValue({error:{message:"offline"}});
    useAuthStore.setState({user:{id:"real",email:user.email,fullName:"Customer",role:"customer"}});
    expect((await useAuthStore.getState().logout()).ok).toBe(false);expect(useAuthStore.getState().user?.id).toBe("real");
  });

});
