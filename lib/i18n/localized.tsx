"use client";

import { Children, cloneElement, isValidElement, type ReactNode } from "react";
import { useTranslation } from "./locale-provider";
import { translateText } from "./translate";
import type { Locale } from "./dictionaries";

// Only presentational props are translated. Identifiers, form values, URLs,
// callbacks, classes and user-entered text remain untouched.
const DISPLAY_PROPS = ["title", "subtitle", "heading", "label", "description", "hint", "placeholder", "alt", "aria-label", "aria-description", "aria-valuetext"];

export function localizeTree(children: ReactNode, locale: Locale): ReactNode {
  return Children.map(children, (child) => {
    if (typeof child === "string") return translateText(child, locale);
    if (!isValidElement<Record<string, unknown>>(child)) return child;
    if (child.props["data-no-localize"] || child.type === "script" || child.type === "style") return child;
    const props: Record<string, unknown> = {};
    for (const key of DISPLAY_PROPS) {
      if (typeof child.props[key] === "string") props[key] = translateText(child.props[key] as string, locale);
    }
    if (child.type !== "textarea" && child.props.children !== undefined) props.children = localizeTree(child.props.children as ReactNode, locale);
    return cloneElement(child, props);
  });
}

/** A render-time boundary for authored legacy JSX, including server-rendered children.
 * This walks React elements, never the DOM; React owns every localized text node.
 * Components with their own rendering logic should also use a boundary or LocalizedText.
 */
export function Localized({ children }: { children: ReactNode }) {
  const { locale } = useTranslation();
  return <>{localizeTree(children, locale)}</>;
}

/** Explicit copy for new UI; safe to use in both server and client component trees. */
export function LocalizedText({ th, en }: { th: string; en: string }) {
  const { locale } = useTranslation();
  return <>{locale === "en" ? en : th}</>;
}

/** Locale-aware dates, including Gregorian years in English. */
export function LocalizedDate({ value, dateOnly = false }: { value: string; dateOnly?: boolean }) {
  const { locale } = useTranslation();
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return <time>{value}</time>;
  return <time dateTime={value}>{new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "th-TH", {
    dateStyle: "medium", ...(dateOnly ? {} : { timeStyle: "short" as const }), timeZone: "Asia/Bangkok",
  }).format(date)}</time>;
}
