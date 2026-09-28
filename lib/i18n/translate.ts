import { dictionaries, type Locale } from "./dictionaries";
import { englishMessages, thaiMessages } from "./messages";

function flattenPair(th: unknown, en: unknown, output: Record<string, string>) {
  if (typeof th === "string" && typeof en === "string") output[th] = en;
  else if (th && en && typeof th === "object" && typeof en === "object") {
    for (const key of Object.keys(th)) flattenPair((th as Record<string, unknown>)[key], (en as Record<string, unknown>)[key], output);
  }
}
const messages = { ...englishMessages };
flattenPair(dictionaries.th, dictionaries.en, messages);

/** Resolve authored display copy. Unknown content (including user input) is preserved. */
export function translateText(text: string, locale: Locale): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (locale === "th") return thaiMessages[normalized] ?? text;
  const translated = messages[normalized];
  if (translated !== undefined) {
    const leading = /^\s/.test(text) ? " " : "";
    const trailing = /\s$/.test(text) ? " " : "";
    return leading + translated + trailing;
  }
  if (!/[ก-๙]/.test(normalized)) return text;
  // Variant summaries join independently authored option labels with a slash.
  if (normalized.includes(" / ")) {
    const parts = normalized.split(" / ");
    if (parts.every((part) => messages[part] !== undefined || !/[ก-๙]/.test(part))) {
      return parts.map((part) => messages[part] ?? part).join(" / ");
    }
  }
  const patterns: [RegExp, (...args: string[]) => string][] = [
    [/^คะแนน (.+) จาก 5$/, (_, rating) => `Rated ${rating} out of 5`],
    [/^รีวิว \((\d+)\)$/, (_, count) => `Reviews (${count})`],
    [/^ผลการค้นหา "(.*)"$/, (_, query) => `Search results for "${query}"`],
    [/^(.+) วันทำการ$/, (_, days) => `${days} business days`],
    [/^(.+) ซม\.$/, (_, size) => `${size} cm`],
    [/^(.+) กก\.$/, (_, weight) => `${weight} kg`],
    [/^ยอดสั่งซื้อขั้นต่ำ (.+) บาท สำหรับคูปองนี้$/, (_, amount) => `This coupon requires a minimum order of ฿${amount}`],
    [/^เปรียบเทียบได้สูงสุด (\d+) รายการ$/, (_, count) => `Compare up to ${count} products`],
    [/^ไม่พบสินค้า (.+) ในระบบ$/, (_, product) => `Product not found: ${product}`],
    [/^สินค้า (.+) มีไม่เพียงพอในสต็อก$/, (_, product) => `Insufficient stock for ${product}`],
    [/^ปัจจุบัน (\d+) รูป — JPG, PNG, WebP$/, (_, count) => `Currently ${count} images — JPG, PNG, WebP`],
    [/^ปัจจุบัน (\d+) เฟรม$/, (_, count) => `Currently ${count} frames`],
    [/^บันทึก Hotspot \((\d+) จุด\)$/, (_, count) => `Save hotspots (${count} points)`],
    [/^บันทึก Hotspot (\d+) จุดแล้ว \(โหมดทดสอบ ยังไม่บันทึกลงฐานข้อมูลจริง\)$/, (_, count) => `Saved ${count} hotspots (demo — not saved to the database)`],
    [/^จุดใหม่ (\d+)$/, (_, count) => `New point ${count}`],
    [/^สี (.+)$/, (_, color) => `Color ${translateText(color, locale)}`],
    [/^(.+) \(สินค้าหมด\)$/, (_, value) => `${translateText(value, locale)} (Out of stock)`],
  ];
  for (const [pattern, replace] of patterns) {
    if (pattern.test(normalized)) return normalized.replace(pattern, replace);
  }
  return text;
}
