import { Loader2 } from "lucide-react";

export default function LoadingScreen() {
  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center gap-6"
      style={{ backgroundColor: "#080D14" }}
    >
      <div
        className="w-14 h-14 rounded-xl flex items-center justify-center"
        style={{ backgroundColor: "#E8391D" }}
      >
        <span className="font-heading text-xl text-white">PIF</span>
      </div>
      <Loader2 className="w-6 h-6 animate-spin" style={{ color: "#3B82F6" }} />
    </div>
  );
}
