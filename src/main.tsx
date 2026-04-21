import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initializeStore, restorePurchases, isIAPAvailable } from "./lib/in-app-purchases";

createRoot(document.getElementById("root")!).render(<App />);

// Hidden for App Store review — IAP initialization disabled
// if (isIAPAvailable()) {
//   initializeStore().then(() => {
//     restorePurchases().catch((err) =>
//       console.warn("[IAP] Restore purchases failed:", err)
//     );
//   });
// }
