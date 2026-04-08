import { Capacitor } from "@capacitor/core";
import { supabase } from "@/integrations/supabase/client";

const PRODUCT_ID = "com.playitforward.basketball.pro.monthly";

/**
 * Checks if IAP is available (native platform only)
 */
export function isIAPAvailable(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios";
}

/**
 * Register products and set up the store using cordova-plugin-purchase.
 * This is called once on app launch.
 */
export async function initializeStore(): Promise<void> {
  if (!isIAPAvailable()) return;

  // cordova-plugin-purchase exposes window.CdvPurchase
  const store = (window as any).CdvPurchase?.store;
  if (!store) {
    console.warn("[IAP] CdvPurchase store not available");
    return;
  }

  const { ProductType, Platform } = (window as any).CdvPurchase;

  store.register([
    {
      id: PRODUCT_ID,
      type: ProductType.PAID_SUBSCRIPTION,
      platform: Platform.APPLE_APPSTORE,
    },
  ]);

  store.when()
    .approved((transaction: any) => {
      // Verify receipt on our server then finish
      verifyAndFinish(transaction);
    })
    .verified((receipt: any) => {
      receipt.finish();
    });

  await store.initialize([Platform.APPLE_APPSTORE]);
}

/**
 * Get the product details (price string etc.)
 */
export function getProduct(): any | null {
  const store = (window as any).CdvPurchase?.store;
  if (!store) return null;
  return store.get(PRODUCT_ID);
}

/**
 * Initiate a purchase
 */
export async function purchaseSubscription(): Promise<{ error?: string }> {
  const store = (window as any).CdvPurchase?.store;
  if (!store) return { error: "Store not available" };

  const product = store.get(PRODUCT_ID);
  if (!product) return { error: "Product not found" };

  const offer = product.getOffer();
  if (!offer) return { error: "No offer available" };

  try {
    await store.order(offer);
    return {};
  } catch (err: any) {
    return { error: err?.message || "Purchase failed" };
  }
}

/**
 * Restore previous purchases
 */
export async function restorePurchases(): Promise<void> {
  const store = (window as any).CdvPurchase?.store;
  if (!store) return;
  await store.restorePurchases();
}

/**
 * Verify receipt with our edge function and finish the transaction
 */
async function verifyAndFinish(transaction: any): Promise<void> {
  try {
    const receiptData = transaction.parentReceipt?.nativeData;
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.error("[IAP] No session for receipt verification");
      return;
    }

    const { error } = await supabase.functions.invoke("verify-apple-receipt", {
      body: {
        receipt_data: receiptData?.appStoreReceipt || transaction.transactionId,
        product_id: PRODUCT_ID,
        transaction_id: transaction.transactionId,
      },
    });

    if (error) {
      console.error("[IAP] Receipt verification failed:", error);
    }

    // Finish the transaction regardless so it doesn't keep prompting
    transaction.verify();
  } catch (err) {
    console.error("[IAP] Error verifying receipt:", err);
    transaction.verify();
  }
}
