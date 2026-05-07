import { Card } from "@/components/ui/card";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { Mail, Inbox, TrendingUp, Layers } from "lucide-react";
import { OutreachRow } from "./OutreachSidebar";
import { useMemo } from "react";

interface Props {
  rows: OutreachRow[];
  repliesCount: number;
}

export function RecruitStatsHero({ rows, repliesCount }: Props) {
  const contacted = rows.length;
  const replyRate = contacted > 0 ? Math.round((repliesCount / contacted) * 100) : 0;
  const pipeline = useMemo(() => new Set(rows.map((r) => r.school_name)).size, [rows]);

  const rateColor =
    replyRate >= 20 ? "text-emerald-600" : replyRate >= 10 ? "text-blue-600" : "text-gray-900";

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
      {/* Reply rate — hero metric */}
      <Card className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100 col-span-2 lg:col-span-2 row-span-1">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-blue-900">
          <TrendingUp className="h-3.5 w-3.5" /> Reply rate
        </div>
        <div className={`mt-1 leading-none font-extrabold ${rateColor} text-5xl lg:text-6xl`}>
          <AnimatedNumber value={replyRate} />%
        </div>
        <p className="text-xs text-gray-600 mt-2">
          {contacted === 0
            ? "Send your first email to start tracking."
            : replyRate >= 10
            ? "That's a real recruiting signal — keep sending."
            : "Average is 15–20%. Volume + a tight pitch wins."}
        </p>
      </Card>

      <Card className="p-4 bg-white border-gray-200">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
          <Mail className="h-3.5 w-3.5" /> Coaches contacted
        </div>
        <div className="mt-1 text-3xl font-bold text-gray-900 leading-none">
          <AnimatedNumber value={contacted} />
        </div>
      </Card>

      <Card className="p-4 bg-white border-gray-200">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
          <Inbox className="h-3.5 w-3.5" /> Replies received
        </div>
        <div className="mt-1 text-3xl font-bold text-emerald-600 leading-none">
          <AnimatedNumber value={repliesCount} />
        </div>
      </Card>

      <Card className="p-4 bg-white border-gray-200 col-span-2 lg:col-span-4">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
          <Layers className="h-3.5 w-3.5" /> Schools in pipeline
        </div>
        <div className="mt-1 text-3xl font-bold text-gray-900 leading-none">
          <AnimatedNumber value={pipeline} />
        </div>
      </Card>
    </div>
  );
}
