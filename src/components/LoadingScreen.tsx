import { Loader2 } from "lucide-react";
import offeredLogo from "@/assets/offered-logo.png.asset.json";

export default function LoadingScreen() {
  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center gap-6"
      style={{ backgroundColor: "#080D14" }}
    >
      <img src={offeredLogo.url} alt="Offered" className="h-10 w-auto" />
      <Loader2 className="w-6 h-6 animate-spin" style={{ color: "#3B82F6" }} />
    </div>
  );
}
