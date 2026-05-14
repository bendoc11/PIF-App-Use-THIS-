import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Bell } from "lucide-react";

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full" style={{ backgroundColor: "#080D14" }}>
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0" style={{ backgroundColor: "#080D14" }}>
          {/* Topbar */}
          <header
            className="flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30"
            style={{
              height: 44,
              backgroundColor: "hsl(218 39% 5%)",
              borderBottom: "1px solid hsla(0, 0%, 100%, 0.10)",
            }}
          >
            <div className="flex items-center">
              <SidebarTrigger
                className="text-white/60 hover:text-white [&_svg]:!w-[18px] [&_svg]:!h-[18px]"
              />
            </div>
            <div className="flex items-center">
              <button className="relative p-1.5 rounded-lg hover:bg-white/5 transition-colors">
                <Bell style={{ width: 18, height: 18 }} className="text-pif-red" strokeWidth={2} />
                <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-pif-red rounded-full animate-pulse" />
              </button>
            </div>
          </header>

          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
