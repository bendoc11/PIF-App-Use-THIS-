import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initializeStore, restorePurchases, isIAPAvailable } from "./lib/in-app-purchases";

createRoot(document.getElementById("root")!).render(<App />);

// Initialize In-App Purchases and restore existing subscriptions on native platforms
if (isIAPAvailable()) {
  initializeStore().then(() => {
    restorePurchases().catch((err) =>
      console.warn("[IAP] Restore purchases failed:", err)
    );
  });
}
