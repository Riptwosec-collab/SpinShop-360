import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { PwaRegister } from "@/components/shared/pwa-register";
import { LocaleProvider } from "@/lib/i18n/locale-provider";

afterEach(() => { cleanup(); localStorage.clear(); });

it("offers installation only after browser eligibility and launches it on user action", async () => {
  localStorage.setItem("spinshop360-locale", "en");
  render(<LocaleProvider><PwaRegister /></LocaleProvider>);
  expect(screen.queryByRole("button", { name: "Install SpinShop" })).not.toBeInTheDocument();
  const event = new Event("beforeinstallprompt", { cancelable: true });
  const prompt = vi.fn().mockResolvedValue(undefined);
  Object.assign(event, { prompt, userChoice: Promise.resolve({ outcome: "accepted" }) });
  act(() => window.dispatchEvent(event));
  expect(event.defaultPrevented).toBe(true);
  expect(prompt).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Install SpinShop" }));
  await waitFor(() => expect(screen.queryByRole("button", { name: "Install SpinShop" })).not.toBeInTheDocument());
  expect(prompt).toHaveBeenCalledOnce();
});

it("dismisses an install offer without launching an installation", () => {
  localStorage.setItem("spinshop360-locale", "en");
  render(<LocaleProvider><PwaRegister /></LocaleProvider>);
  const event = new Event("beforeinstallprompt", { cancelable: true });
  const prompt = vi.fn();
  Object.assign(event, { prompt, userChoice: Promise.resolve({ outcome: "dismissed" }) });
  act(() => window.dispatchEvent(event));
  fireEvent.click(screen.getByRole("button", { name: "Dismiss install suggestion" }));
  expect(screen.queryByRole("button", { name: "Install SpinShop" })).not.toBeInTheDocument();
  expect(prompt).not.toHaveBeenCalled();
});
