import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { fbPixel } from "@/lib/fbpixel";

/**
 * Fires a Meta Pixel PageView on every client-side route change.
 * The initial PageView is fired by the base snippet in index.html, so we
 * skip duplicating that one and only track subsequent SPA navigations.
 */
export function MetaPixelTracker() {
  const location = useLocation();

  useEffect(() => {
    fbPixel.pageView();
  }, [location.pathname, location.search]);

  return null;
}
