export type AnalyticsEvent =
  | "product_view"
  | "product_3d_open"
  | "product_360_open"
  | "product_rotate"
  | "product_zoom"
  | "product_hotspot_click"
  | "product_ar_open"
  | "variant_select"
  | "add_to_cart"
  | "remove_from_cart"
  | "begin_checkout"
  | "coupon_apply"
  | "purchase"
  | "wishlist_add"
  | "review_submit";

export interface AnalyticsAdapter {
  track(event: AnalyticsEvent, properties?: Record<string, unknown>): void;
  identify(userId: string, traits?: Record<string, unknown>): void;
}

class MockAnalyticsAdapter implements AnalyticsAdapter {
  track(event: AnalyticsEvent, properties?: Record<string, unknown>) {
    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.debug("[analytics:mock]", event, properties ?? {});
    }
  }
  identify() {
    /* no-op in mock mode */
  }
}

class PostHogAnalyticsAdapter implements AnalyticsAdapter {
  track(event: AnalyticsEvent, properties?: Record<string, unknown>) {
    if (typeof window === "undefined") return;
    import("posthog-js").then(({ default: posthog }) => {
      posthog.capture(event, properties);
    });
  }
  identify(userId: string, traits?: Record<string, unknown>) {
    if (typeof window === "undefined") return;
    import("posthog-js").then(({ default: posthog }) => {
      posthog.identify(userId, traits);
    });
  }
}

let adapter: AnalyticsAdapter | null = null;

/**
 * Returns the active analytics adapter. Switches to PostHog automatically
 * once `NEXT_PUBLIC_POSTHOG_KEY` is set — no call-site changes required.
 * `initAnalytics()` (called once from `Providers`) boots the PostHog SDK
 * itself; this factory only decides which adapter `track()` calls use.
 */
export function getAnalyticsAdapter(): AnalyticsAdapter {
  if (adapter) return adapter;
  adapter = process.env.NEXT_PUBLIC_POSTHOG_KEY ? new PostHogAnalyticsAdapter() : new MockAnalyticsAdapter();
  return adapter;
}

export function track(event: AnalyticsEvent, properties?: Record<string, unknown>) {
  getAnalyticsAdapter().track(event, properties);
}

export function identify(userId: string, traits?: Record<string, unknown>) {
  getAnalyticsAdapter().identify(userId, traits);
}
