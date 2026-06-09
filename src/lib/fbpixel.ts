// Meta Pixel helper. The base Pixel script is loaded in index.html and
// exposes the global `fbq` function. Use these helpers to fire conversion
// events safely (no-ops if the pixel hasn't loaded, e.g. blocked by an
// ad blocker).

declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
  }
}

function track(event: string, params?: Record<string, any>) {
  try {
    if (typeof window !== "undefined" && typeof window.fbq === "function") {
      if (params) window.fbq("track", event, params);
      else window.fbq("track", event);
    }
  } catch (e) {
    console.warn("[fbpixel] track failed", e);
  }
}

export const fbPixel = {
  pageView: () => track("PageView"),
  lead: () => track("Lead"),
  completeRegistration: () => track("CompleteRegistration"),
  initiateCheckout: () => track("InitiateCheckout"),
  subscribe: (value = 19.99, currency = "USD") =>
    track("Subscribe", { value, currency, predicted_ltv: value * 12 }),
  purchase: (value = 19.99, currency = "USD") =>
    track("Purchase", { value, currency }),
  search: (search_string?: string) =>
    track("Search", search_string ? { search_string } : undefined),
  viewContent: (params?: { content_name?: string; content_category?: string; content_ids?: string[] }) =>
    track("ViewContent", params),
};
