// Meta Pixel helper. The Pixel script is loaded in index.html and exposes
// the global `fbq` function. Use these helpers to fire conversion events
// safely (no-ops if the pixel hasn't loaded, e.g. blocked by an ad blocker).

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
    // never throw from analytics
    console.warn("[fbpixel] track failed", e);
  }
}

export const fbPixel = {
  completeRegistration: () => track("CompleteRegistration"),
  initiateCheckout: () => track("InitiateCheckout"),
  purchase: (value = 19.99, currency = "USD") =>
    track("Purchase", { value, currency }),
  lead: () => track("Lead"),
};
