import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";
import { App } from "@capacitor/app";
import { supabase } from "@/integrations/supabase/client";

const CUSTOM_SCHEME = "com.playitforward.basketball";

/**
 * Checks if we're running inside a native Capacitor shell (iPhone or iPad).
 */
export function isNativePlatform(): boolean {
  return Capacitor.isNativePlatform();
}

/**
 * Opens the Supabase OAuth flow in the Capacitor in-app browser
 * (Safari View Controller on iOS — works on both iPhone and iPad)
 * and listens for the custom URL scheme redirect to complete the sign-in.
 */
export async function signInWithOAuthNative(
  provider: "google" | "apple"
): Promise<{ error?: Error }> {
  try {
    // Build the OAuth URL via Supabase (skipBrowserRedirect prevents the SDK from opening it)
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        skipBrowserRedirect: true,
        redirectTo: `${CUSTOM_SCHEME}://auth/callback`,
      },
    });

    if (error || !data?.url) {
      return { error: error ?? new Error("Failed to generate OAuth URL") };
    }

    // Open the OAuth URL in the in-app browser (Safari View Controller on iOS).
    // Using windowName '_self' and presentationStyle 'popover' to force the
    // in-app browser on iPad (which otherwise may open external Safari).
    await Browser.open({
      url: data.url,
      windowName: "_self",
      presentationStyle: "popover",
      toolbarColor: "#000000",
    });

    // Wait for the app to receive the redirect via the custom URL scheme
    return new Promise((resolve) => {
      const handleAppUrl = async (event: { url: string }) => {
        // Only handle our custom scheme callback
        if (!event.url.startsWith(`${CUSTOM_SCHEME}://auth/callback`)) return;

        // Close the in-app browser
        try {
          await Browser.close();
        } catch {
          // Browser may already be closed
        }

        // Remove the listener
        const resolvedListener = await listenerPromise;
        await resolvedListener.remove();

        // Extract the auth code or tokens from the URL
        const url = new URL(event.url.replace(`${CUSTOM_SCHEME}://`, "https://placeholder/"));
        const code = url.searchParams.get("code");

        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            resolve({ error: exchangeError });
          } else {
            resolve({});
          }
        } else {
          // Check for hash-based tokens (implicit flow)
          const hashParams = new URLSearchParams(url.hash.replace("#", ""));
          const accessToken = hashParams.get("access_token");
          const refreshToken = hashParams.get("refresh_token");

          if (accessToken && refreshToken) {
            const { error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            resolve({ error: sessionError ?? undefined });
          } else {
            const errorDesc = url.searchParams.get("error_description") || url.searchParams.get("error");
            resolve({ error: new Error(errorDesc || "Authentication failed") });
          }
        }
      };

      const listenerPromise = App.addListener("appUrlOpen", handleAppUrl);

      // Also listen for browserFinished in case user dismisses the browser manually
      Browser.addListener("browserFinished", async () => {
        // Give a small delay for the appUrlOpen to fire first
        setTimeout(async () => {
          const listener = await listenerPromise;
          await listener.remove();
        }, 2000);
      });

      // Safety timeout — if nothing happens in 2 minutes, clean up
      setTimeout(async () => {
        const listener = await listenerPromise;
        await listener.remove();
        resolve({ error: new Error("Authentication timed out") });
      }, 120_000);
    });
  } catch (err) {
    return { error: err instanceof Error ? err : new Error(String(err)) };
  }
}
