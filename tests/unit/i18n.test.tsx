import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { dictionaries } from "@/lib/i18n/dictionaries";
import { englishMessages } from "@/lib/i18n/messages";
import { LocaleProvider, useTranslation } from "@/lib/i18n/locale-provider";
import { Localized, LocalizedDate, LocalizedText } from "@/lib/i18n/localized";
import { translateText } from "@/lib/i18n/translate";
import AboutPage from "@/app/(store)/about/page";
import { Toaster } from "@/components/shared/toaster";
import { useToastStore } from "@/lib/stores/toast-store";

beforeEach(() => localStorage.clear());
afterEach(cleanup);
function Switcher() {
  const { locale, setLocale } = useTranslation();
  return <button onClick={() => setLocale(locale === "th" ? "en" : "th")}>Switch language</button>;
}
function mount(children: React.ReactNode) {
  return render(<LocaleProvider><Switcher />{children}</LocaleProvider>);
}

describe("complete locale rendering", () => {
  it("preserves dictionary key parity with nonempty English values", () => {
    for (const section of Object.keys(dictionaries.th) as (keyof typeof dictionaries.th)[]) {
      expect(Object.keys(dictionaries.en[section])).toEqual(Object.keys(dictionaries.th[section]));
      for (const value of Object.values(dictionaries.en[section])) expect(value.trim()).not.toBe("");
    }
    for (const value of Object.values(englishMessages)) expect(value.trim()).not.toBe("");
  });
  it("switches nested server page content and remembers the preference", () => {
    mount(<AboutPage />);
    expect(screen.getByRole("heading", { name: "เราคือใคร" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Switch language" }));
    expect(screen.getByRole("heading", { name: "Who we are" })).toBeInTheDocument();
    expect(screen.getByText(/Accurate product information/)).toBeInTheDocument();
    expect(localStorage.getItem("spinshop360-locale")).toBe("en");
    expect(document.documentElement.lang).toBe("en");
    fireEvent.click(screen.getByRole("button", { name: "Switch language" }));
    expect(screen.getByRole("heading", { name: "เราคือใคร" })).toBeInTheDocument();
  });
  it("localizes labels and placeholders without changing form values or URLs", () => {
    localStorage.setItem("spinshop360-locale", "en");
    mount(<Localized><input aria-label="ชื่อ" placeholder="ชื่อ-นามสกุล" defaultValue="ชื่อ" /><textarea aria-label="ข้อความ" placeholder="ข้อความ" defaultValue="ข้อความ" /><a href="/products?search=สี" title="สินค้า">สินค้าทั้งหมด</a></Localized>);
    expect(screen.getByRole("textbox", { name: "Name" })).toHaveAttribute("placeholder", "Full name");
    expect(screen.getByRole("textbox", { name: "Name" })).toHaveValue("ชื่อ");
    expect(screen.getByRole("textbox", { name: "Message" })).toHaveValue("ข้อความ");
    expect(screen.getByRole("link", { name: "All Products" })).toHaveAttribute("href", "/products?search=สี");
  });
  it("switches an already visible service error and dynamic stock messages", () => {
    useToastStore.setState({ toasts: [{ id: "coupon", message: "ไม่พบคูปองนี้ หรือคูปองหมดอายุแล้ว", variant: "error" }] });
    mount(<Toaster />);
    fireEvent.click(screen.getByRole("button", { name: "Switch language" }));
    expect(screen.getByText("Coupon not found or expired")).toBeInTheDocument();
    expect(translateText("เปรียบเทียบได้สูงสุด 4 รายการ", "en")).toBe("Compare up to 4 products");
    expect(translateText("ยอดสั่งซื้อขั้นต่ำ 500 บาท สำหรับคูปองนี้", "en")).toBe("This coupon requires a minimum order of ฿500");
    expect(translateText("User supplied text", "en")).toBe("User supplied text");
  });
  it("localizes explicit messages and dates, including the calendar year", () => {
    localStorage.setItem("spinshop360-locale", "en");
    mount(<><LocalizedText th="ชำระเงินแล้ว" en="Paid" /><LocalizedDate value="2026-01-15T00:00:00Z" /></>);
    expect(screen.getByText("Paid")).toBeInTheDocument();
    expect(screen.getByText(/15 Jan 2026/)).toBeInTheDocument();
  });
});
